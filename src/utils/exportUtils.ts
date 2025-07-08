import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a chart element as PNG
 */
export const exportChartAsPNG = async (
  element: HTMLElement, 
  filename: string = 'chart.png'
) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting chart as PNG:', error);
    throw error;
  }
};

/**
 * Export a chart element as PDF
 */
export const exportChartAsPDF = async (
  element: HTMLElement,
  filename: string = 'chart.pdf',
  title?: string
) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    // Add title if provided
    if (title) {
      pdf.setFontSize(20);
      pdf.text(title, 40, 40);
    }
    
    pdf.addImage(imgData, 'PNG', 0, title ? 60 : 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting chart as PDF:', error);
    throw error;
  }
};

/**
 * Export chart data as CSV
 */
export const exportDataAsCSV = (
  data: any[],
  filename: string = 'data.csv',
  headers?: string[]
) => {
  try {
    let csv = '';
    
    // Add headers
    if (headers && headers.length > 0) {
      csv += headers.join(',') + '\n';
    } else if (data.length > 0) {
      // Auto-generate headers from first object
      csv += Object.keys(data[0]).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
      const values = headers 
        ? headers.map(header => row[header] || '')
        : Object.values(row);
      csv += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Error exporting data as CSV:', error);
    throw error;
  }
};

/**
 * Generate a shareable link for a chart view
 */
export const generateShareableLink = (
  chartType: string,
  chartData: any,
  baseUrl: string = window.location.origin
): string => {
  try {
    // Create a unique identifier for this chart state
    const chartState = {
      type: chartType,
      data: chartData,
      timestamp: Date.now()
    };
    
    // Encode the state
    const encodedState = btoa(JSON.stringify(chartState));
    
    // Generate URL
    const shareUrl = `${baseUrl}/share/${chartType}?state=${encodedState}`;
    
    return shareUrl;
  } catch (error) {
    console.error('Error generating shareable link:', error);
    throw error;
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};