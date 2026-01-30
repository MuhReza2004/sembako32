import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { formatRupiah } from "@/helper/format";
import * as fs from "fs/promises";
import * as path from "path";
import { adminDb } from "@/lib/firebase-admin";
import { Pembelian, PembelianDetail } from "@/app/types/pembelian";

// This function is for server-side use with admin privileges
const getAllPembelianAdmin = async (): Promise<Pembelian[]> => {
  const q = adminDb.collection("pembelian").orderBy("createdAt", "desc");
  const snap = await q.get();

  const pembelianList: Pembelian[] = [];

  for (const docSnap of snap.docs) {
    const pembelianData = docSnap.data() as Pembelian;
    const pembelianId = docSnap.id;

    // Fetch supplier name
    let supplierData = null;
    if (pembelianData.supplierId) {
      try {
        const supplierDoc = await adminDb
          .collection("suppliers")
          .doc(pembelianData.supplierId)
          .get();
        if (supplierDoc.exists) {
          supplierData = supplierDoc.data();
        }
      } catch (e) {
        console.error(
          `Could not fetch supplier: ${pembelianData.supplierId}`,
          e,
        );
      }
    }

    // Fetch details
    const detailQuery = adminDb
      .collection("pembelian_detail")
      .where("pembelianId", "==", pembelianId);
    const detailSnap = await detailQuery.get();
    const details: PembelianDetail[] = [];

    for (const detailDoc of detailSnap.docs) {
      const detailData = detailDoc.data();
      const supplierProdukDoc = await adminDb
        .collection("supplier_produk")
        .doc(detailData.supplierProdukId)
        .get();
      const supplierProdukData = supplierProdukDoc.data();
      if (supplierProdukData) {
        const produkDoc = await adminDb
          .collection("produk")
          .doc(supplierProdukData.produkId)
          .get();
        const produkData = produkDoc.data();
        details.push({
          id: detailDoc.id,
          ...detailData,
          namaProduk: produkData?.nama || "Produk Tidak Ditemukan",
          satuan: produkData?.satuan || "",
        } as PembelianDetail);
      } else {
        details.push({
          id: detailDoc.id,
          ...detailData,
          namaProduk: "Produk Tidak Ditemukan",
        } as PembelianDetail);
      }
    }

    pembelianList.push({
      id: pembelianId,
      ...pembelianData,
      namaSupplier: supplierData?.nama || "Supplier Tidak Diketahui",
      items: details,
    });
  }

  return pembelianList;
};

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    const logoPath = path.join(process.cwd(), "public", "logo.svg");
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = logoBuffer.toString("base64");
    const logoSrc = `data:image/svg+xml;base64,${logoBase64}`;

    const allPurchases = await getAllPembelianAdmin();

    let filteredPurchases = allPurchases;
    if (startDate) {
      filteredPurchases = filteredPurchases.filter(
        (p) => new Date(p.tanggal) >= new Date(startDate),
      );
    }
    if (endDate) {
      filteredPurchases = filteredPurchases.filter(
        (p) => new Date(p.tanggal) <= new Date(endDate),
      );
    }

    const totalPurchases = filteredPurchases.length;
    const totalCost = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    const paidPurchases = filteredPurchases.filter(
      (p) => p.status === "Pending",
    ).length;
    const unpaidPurchases = filteredPurchases.filter(
      (p) => p.status === "Completed",
    ).length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Laporan Pembelian</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              color: #1f2937;
              font-size: 11px;
              background: #fff;
            }

            .container {
              width: 100%;
              background: white;
              padding: 0 30px;
            }

            .report-title {
              text-align: center;
              padding: 25px 0 20px;
              border-bottom: 3px solid #147146;
              margin-bottom: 25px;
            }

            .report-title h2 {
              margin: 0 0 10px 0;
              font-size: 20px;
              color: #000000;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .report-title .period {
              display: inline-block;
              background: #147146;
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 10px;
              font-weight: 500;
              margin-top: 5px;
            }

            .summary-legend {
                padding: 15px 20px;
                margin-bottom: 25px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background-color: #f9fafb;
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px 25px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 10px;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .summary-item:nth-last-child(-n+2) {
                border-bottom: none;
            }
            
            .summary-item-label {
                color: #4b5563;
                font-weight: 600;
            }
            
            .summary-item-value {
                font-weight: 700;
                color: #1f2937;
            }

            .table-container {
              overflow-x: auto;
              margin-bottom: 30px;
            }

            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              font-size: 9px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }

            thead tr {
              background: #147146;
              color: white;
            }

            th {
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            td {
              padding: 8px;
              border-bottom: 1px solid #f3f4f6;
              vertical-align: top;
            }

            tbody tr:last-child td {
              border-bottom: none;
            }

            tbody tr:nth-child(even) {
              background-color: #fafafa;
            }
            
            .status-lunas {
              background-color: #d1fae5;
              color: #065f46;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              display: inline-block;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .status-belum-lunas {
              background-color: #3a763f;
              color: #ffffff;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              display: inline-block;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .text-right { 
              text-align: right; 
              font-weight: 600; 
            }
            
            .text-center { 
              text-align: center;
              vertical-align: middle;
            }

            .products-list {
              margin: 0;
              padding: 0;
              list-style: none;
            }

            .products-list li {
              margin-bottom: 3px;
              font-size: 8px;
              line-height: 1.4;
            }

            .totals-summary {
                float: right;
                width: 280px;
                margin-top: 15px;
                page-break-inside: avoid;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .total-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                font-size: 10px;
            }
            
            .total-item-label {
                color: #4b5563;
                font-weight: 600;
            }
            
            .total-item-value {
                font-weight: 700;
                color: #1f2937;
            }
            
            .grand-total {
                background-color: #147146;
                color: white;
            }
            
            .grand-total .total-item-label, .grand-total .total-item-value {
                color: white;
                font-size: 12px;
            }

            .signature-section {
                margin-top: 50px;
                page-break-inside: avoid;
                float: right;
                clear: both;
                text-align: center;
            }
            
            .signature-line {
                border-top: 1px solid #1f2937;
                width: 200px;
                margin-top: 60px;
            }
            
            .signature-name {
                font-weight: 600;
                font-size: 10px;
                margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="report-title">
              <h2>Laporan Pembelian</h2>
              <span class="period">
                ${startDate && endDate ? new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) + " - " + new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : startDate ? "Dari: " + new Date(startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : endDate ? "Sampai: " + new Date(endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Semua Periode"}
              </span>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="text-center">No</th>
                    <th>Tanggal</th>
                    <th>Invoice</th>
                    <th>No. Pesanan</th>
                    <th>Supplier</th>
                    <th>Produk Dibeli</th>
                    <th class="text-right">Total</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredPurchases
                    .map(
                      (p, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${new Date(p.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td style="font-weight: 600; color: #147146;">${p.invoice || "-"}</td>
                      <td>${p.noDO || "-"}</td>
                      <td><strong>${p.namaSupplier}</strong></td>
                      <td>
                        ${
                          p.items && p.items.length > 0
                            ? `<ul class="products-list">${p.items
                                .map(
                                  (item) =>
                                    `<li><strong style="text-center padding: 5px;">${item.namaProduk}</strong><br>${item.qty} ${item.satuan || ""} × ${formatRupiah(item.harga)}</li>`,
                                )
                                .join("")}</ul>`
                            : "<small style='color: #9ca3af;'>Tidak ada item</small>"
                        }
                      </td>
                      <td class="text-center"><strong style="color: #147146; font-size: 10px;">${formatRupiah(p.total)}</strong></td>
                      <td class="text-center">
                        <span class="${p.status === "Lunas" ? "status-lunas" : "status-belum-lunas"}">
                          ${p.status}
                        </span>
                      </td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="totals-summary">
                <div class="total-item grand-total">
                    <span class="total-item-label">Total Belanja:</span>
                    <span class="total-item-value">${formatRupiah(totalCost)}</span>
                </div>
            </div>

            <div class="signature-section">
                <div style="font-size: 10px; margin-bottom: 5px;">Mengetahui,<br>PT. Sumber Alam Pasangkayu</div>
                <div class="signature-line"></div>
                <div class="signature-name">AM.BISNIS</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create a base64 SVG for the gradient background
    const svgGradient = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10B981;" />
            <stop offset="100%" style="stop-color:#0D9488;" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    const gradientBg = `data:image/svg+xml;base64,${Buffer.from(svgGradient).toString("base64")}`;

    const headerTemplate = `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        width: 100%;
        height: 100px;
        -webkit-print-color-adjust: exact;
        color: white;
      ">
        <div style="
          background-image: url('${gradientBg}');
          background-size: cover;
          border-radius: 8px;
          margin: 0 auto;
          width: 85%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        ">
          <div style="display: flex; align-items: center; gap: 20px;">
            <img src="${logoSrc}" style="height: 55px; width: 55px; background: white; border-radius: 8px; padding: 6px;" />
            <div>
              <h1 style="font-size: 18px; color: white; margin: 0 0 10px 0; font-weight: 700; letter-spacing: 0.5px;">PT. Sumber Alam Pasangkayu</h1>
              <div style="font-size: 9px; line-height: 1.7; color: white; opacity: 0.95;">
                <div><strong style="display: inline-block; width: 45px;">Alamat</strong> : Jl. Soekarno Hatta Pasangkayu</div>
                <div><strong style="display: inline-block; width: 45px;">Kontak</strong> : 0821-9030-9333</div>
                <div><strong style="display: inline-block; width: 45px;">Email</strong> : sumberalampasangkayu@gmail.com</div>
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 9px; color: white; opacity: 0.9;">
            <div style="margin-bottom: 4px; font-weight: 500;">Tanggal Cetak:</div>
            <div style="font-weight: 600; font-size: 10px;">${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
        </div>
      </div>
    `;

    const footerTemplate = `
      <div style="
        font-family: 'Segoe UI', sans-serif;
        width: 100%;
        text-align: center;
        padding: 5px 20px;
        font-size: 8px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
      ">
        Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
      </div>
    `;

    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Creating new page...");
    const page = await browser.newPage();

    console.log("Setting content...");
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "150px",
        right: "20px",
        bottom: "50px",
        left: "20px",
      },
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
    });

    console.log("Closing browser...");
    await browser.close();
    console.log("PDF generated successfully");

    const filename = `laporan_pembelian_${new Date().toISOString().split("T")[0]}.pdf`;
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", errorMessage);
    if (errorStack) console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: "Gagal membuat laporan PDF", details: errorMessage },
      { status: 500 },
    );
  }
}
