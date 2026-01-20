import jsPDF from 'jspdf';

export const generateCertificate = (donorName, bloodGroup, date, requestId) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // 1. BACKGROUND (Creamy Off-White)
    doc.setFillColor(252, 252, 250); 
    doc.rect(0, 0, width, height, 'F');

    // 2. ELEGANT BORDERS
    // Main Navy Border
    doc.setDrawColor(30, 41, 59); // Navy Blue
    doc.setLineWidth(1.5);
    doc.rect(10, 10, width - 20, height - 20);
    
    // Thin Gold Inner Border
    doc.setDrawColor(180, 83, 9); // Gold
    doc.setLineWidth(0.3);
    doc.rect(13, 13, width - 26, height - 26);

    // 3. TOP LOGO AREA
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("LIFEDROP • BLOOD DONATION NETWORK", width / 2, 25, { align: "center" });

    // 4. MAIN TITLE
    doc.setTextColor(30, 41, 59);
    doc.setFont("times", "bold");
    doc.setFontSize(38);
    doc.text("Certificate of Appreciation", width / 2, 50, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("THIS ACKNOWLEDGES THAT", width / 2, 65, { align: "center" });

    // 5. DONOR NAME (Centerpiece)
    doc.setTextColor(15, 23, 42);
    doc.setFont("times", "italic");
    doc.setFontSize(50);
    doc.text(donorName, width / 2, 90, { align: "center" });

    // Elegant line under name
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(width / 2 - 50, 95, width / 2 + 50, 95);

    // 6. BODY TEXT
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    const msg = `Has demonstrated exceptional humanitarian spirit by voluntarily donating Blood Group '${bloodGroup}'. This selfless act reflects a profound commitment to saving lives and serving the community.`;
    const splitMsg = doc.splitTextToSize(msg, 180);
    doc.text(splitMsg, width / 2, 110, { align: "center", lineHeightFactor: 1.5 });

    // 7. GOLDEN EMBLEM (Clean Seal)
    const sealX = width / 2;
    const sealY = 160;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.8);
    doc.circle(sealX, sealY, 15, 'D'); // Outer Circle
    
    doc.setLineWidth(0.2);
    doc.circle(sealX, sealY, 13, 'D'); // Inner Circle

    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL SEAL", sealX, sealY - 3, { align: "center" });
    doc.setFontSize(9);
    doc.text("VERIFIED", sealX, sealY + 2, { align: "center" });
    doc.setFontSize(7);
    doc.text("HERO", sealX, sealY + 6, { align: "center" });

    // 8. SIGNATURES & DATE
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    
    // Date (Left)
    doc.setFont("helvetica", "bold");
    doc.text("DATE OF DONATION", 65, 160, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text(date || new Date().toLocaleDateString(), 65, 168, { align: "center" });
    doc.line(45, 162, 85, 162);

    // Signatory (Right)
    doc.setFont("times", "bolditalic");
    doc.setFontSize(14);
    doc.text("Admin, LifeDrop AI", 232, 160, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AUTHORIZED SIGNATORY", 232, 168, { align: "center" });
    doc.line(210, 162, 255, 162);

    // 9. SECURITY FOOTER (Clean Strip)
    doc.setFillColor(30, 41, 59); // Navy Footer
    doc.rect(0, height - 12, width, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Blockchain Verified Record ID: LD-TRANS-${requestId}`, 15, height - 5);
    doc.text(`"Every drop matters"`, width / 2, height - 5, { align: "center" });
    doc.text(`Verification Date: ${new Date().toLocaleDateString()}`, width - 15, height - 5, { align: "right" });

    // 10. SAVE
    doc.save(`LifeDrop_Hero_Certificate_${donorName}.pdf`);
};