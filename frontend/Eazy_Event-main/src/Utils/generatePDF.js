// Dynamic imports — jsPDF (~250KB) and html2canvas (~200KB) are loaded
// only when user clicks "Download PDF", not on page load
export const generateTicketPDF = async (ticketData, event) => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  // Create a temporary div with the ticket content
  const ticketDiv = document.createElement('div');
  ticketDiv.style.position = 'absolute';
  ticketDiv.style.left = '-9999px';
  ticketDiv.style.top = '0';
  ticketDiv.style.width = '600px';
  ticketDiv.style.backgroundColor = 'white';
  ticketDiv.style.padding = '20px';
  ticketDiv.style.fontFamily = 'Arial, sans-serif';
  
  ticketDiv.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px;">${event.title}</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Event Ticket</p>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="margin-bottom: 15px; color: #374151;">Order Information</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #6b7280;">Order ID:</span>
        <span style="color: #1f2937;">${ticketData._id || ticketData.orderId}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #6b7280;">Quantity:</span>
        <span style="color: #1f2937;">${ticketData.quantity || 1}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #6b7280;">Total Amount:</span>
        <span style="color: #1f2937;">₹${ticketData.totalAmount || event.price}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-weight: 600; color: #6b7280;">Payment ID:</span>
        <span style="color: #1f2937;">${ticketData.paymentId || 'N/A'}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
      <div>
        <h3 style="color: #374151; margin-bottom: 15px; font-size: 18px;">Event Details</h3>
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #6b7280; margin-right: 10px;">📅</span>
          <span style="color: #4b5563;">${new Date(event.startDateTime).toLocaleDateString()}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #6b7280; margin-right: 10px;">🕐</span>
          <span style="color: #4b5563;">${new Date(event.startDateTime).toLocaleTimeString()}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="color: #6b7280; margin-right: 10px;">📍</span>
          <span style="color: #4b5563;">${event.location}</span>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h3 style="margin-bottom: 15px; color: #374151;">QR Code</h3>
        <div style="width: 150px; height: 150px; margin: 0 auto; background: #e5e7eb; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`Event: ${event.title}\nOrder: ${ticketData._id || ticketData.orderId}\nDate: ${new Date(event.startDateTime).toLocaleDateString()}`)}" alt="QR Code" style="width: 150px; height: 150px; border-radius: 8px;" />
        </div>
        <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">Scan for verification</p>
      </div>
    </div>
    
    <div style="text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      <p style="margin: 0;">Thank you for your purchase!</p>
      <p style="margin: 5px 0 0 0;">Present this ticket at the event entrance</p>
    </div>
  `;
  
  // Add to document
  document.body.appendChild(ticketDiv);
  
  try {
    // Convert to canvas
    const canvas = await html2canvas(ticketDiv, {
      width: 600,
      height: ticketDiv.scrollHeight,
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    const fileName = `ticket-${event.title.replace(/\s+/g, '-')}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to simple text download
    const textContent = `
EVENT TICKET
============

Event: ${event.title}
Date: ${new Date(event.startDateTime).toLocaleDateString()}
Time: ${new Date(event.startDateTime).toLocaleTimeString()}
Location: ${event.location}
Quantity: ${ticketData.quantity || 1}
Total: ₹${ticketData.totalAmount || event.price}
Order ID: ${ticketData._id || ticketData.orderId}
Payment ID: ${ticketData.paymentId || 'N/A'}

Thank you for your purchase!
    `;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${event.title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    // Clean up
    document.body.removeChild(ticketDiv);
  }
};