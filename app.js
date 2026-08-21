/**
 * KPEMBE M/A JHS FRONTEND SCRIPT
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxGnfXB2r_MFJJEpHN9I8PWETb9EW57Y954WYmNMsJ5Bttn-EPuzgvYjGoIeA-Kt5xC/exec';

document.addEventListener('DOMContentLoaded', () => {
  initImageLightbox();
  loadStaffData();
  loadNewsData();

  // Handle Result Search Form
  const resultForm = document.getElementById('resultForm');
  if (resultForm) {
    resultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        action: 'checkResult',
        name: document.getElementById('resName').value,
        dob: document.getElementById('resDob').value,
        className: document.getElementById('resClass').value,
        serial: document.getElementById('resSerial').value
      };

      const response = await postData(payload);
      
      if (response.status === 'success') {
        displayResults(response.result);
      } else {
        alert(response.message);
      }
    });
  }

  // Handle Anonymous Complaint Form Submission
  const complaintForm = document.getElementById('complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = document.getElementById('complaintMsg').value;
      const res = await postData({ action: 'submitComplaint', message });
      if (res.status === 'success') {
        alert('Thank you. Your feedback has been sent anonymously.');
        complaintForm.reset();
      }
    });
  }

  // Handle PDF Export Action
  const pdfBtn = document.getElementById('downloadPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      const element = document.getElementById('pdfContent');
      html2pdf().from(element).save('Kpembe_JHS_Result_Report.pdf');
    });
  }
});

// Render Dynamic Terminal Result Card
function displayResults(data) {
  const container = document.getElementById('reportContainer');
  const detailsDiv = document.getElementById('studentDetails');
  const tbody = document.querySelector('#resultsTable tbody');
  const summaryDiv = document.getElementById('summaryDetails');

  detailsDiv.innerHTML = `
    <p><strong>Student Name:</strong> ${data.name}</p>
    <p><strong>Serial No:</strong> ${data.serial} | <strong>Class:</strong> ${data.className} (${data.year})</p>
    <p><strong>Date of Birth:</strong> ${data.dob}</p>
    <br>
  `;

  tbody.innerHTML = '';
  data.subjects.forEach(sub => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sub.title}</td>
      <td>${sub.ca}</td>
      <td>${sub.exam}</td>
      <td>${sub.total}</td>
      <td>${sub.grade}</td>
      <td>${sub.interp}</td>
      <td>${sub.remark}</td>
    `;
    tbody.appendChild(tr);
  });

  summaryDiv.innerHTML = `
    <br>
    <p><strong>Overall Total Score:</strong> ${data.totalScore}</p>
    <p><strong>Class Rank Position:</strong> ${data.position}</p>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

// Fullscreen Image Lightbox
function initImageLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  document.body.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.classList.contains('zoomable') || e.target.closest('.card'))) {
      lightboxImg.src = e.target.src;
      lightbox.style.display = 'flex';
    }
  });

  lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });
}

// Fetch Staff Directory
async function loadStaffData() {
  const staffGrid = document.getElementById('staffGrid');
  if (!staffGrid) return;
  
  const res = await postData({ action: 'getStaff' });
  if (res.status === 'success' && res.data.length > 0) {
    staffGrid.innerHTML = '';
    res.data.forEach(stf => {
      staffGrid.innerHTML += `
        <div class="card" style="text-align:center;">
          <img src="${stf.PhotoURL}" alt="${stf.Name}" class="zoomable" style="width:100px; height:100px; border-radius:50%; object-fit:cover; margin-bottom:0.5rem;">
          <h4>${stf.Name}</h4>
          <p style="font-size:0.85rem; color:#666;">${stf.Email}</p>
          <p style="margin-top:0.5rem; font-size:0.9rem;">${stf.Bio}</p>
        </div>
      `;
    });
  }
}

// Fetch News Items
async function loadNewsData() {
  const newsGrid = document.getElementById('newsGrid');
  if (!newsGrid) return;

  const res = await postData({ action: 'getNews' });
  if (res.status === 'success' && res.data.length > 0) {
    newsGrid.innerHTML = '';
    res.data.forEach(item => {
      newsGrid.innerHTML += `
        <div class="card">
          <img src="${item.ImageURL}" class="zoomable" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:0.5rem;">
          <h4>${item.Title}</h4>
          <small style="color:#888;">${item.Date}</small>
          <p style="margin-top:0.5rem;">${item.Content}</p>
        </div>
      `;
    });
  }
}

// Shared Fetch Helper
async function postData(data) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    return { status: 'error', message: 'Unable to connect to backend engine.' };
  }
}
