/**
 * KPEMBE M/A JHS FRONTEND ENGINE & PWA CONTROLLER
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbxGnfXB2r_MFJJEpHN9I8PWETb9EW57Y954WYmNMsJ5Bttn-EPuzgvYjGoIeA-Kt5xC/exec';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initPWAInstallPrompt();
  initImageLightbox();
  loadStaffData();
  loadNewsData();

  // Handle Result Search Form
  const resultForm = document.getElementById('resultForm');
  if (resultForm) {
    resultForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('searchSubmitBtn');
      setLoadingState(submitBtn, true);

      const payload = {
        action: 'checkResult',
        name: document.getElementById('resName').value,
        dob: document.getElementById('resDob').value,
        className: document.getElementById('resClass').value,
        serial: document.getElementById('resSerial').value
      };

      const response = await postData(payload);
      setLoadingState(submitBtn, false);
      
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

// Tab Navigation Manager
function initTabs() {
  const switchTab = (targetId) => {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Deactivate all desktop/mobile buttons
    document.querySelectorAll('.nav-tab, .mobile-tab-btn').forEach(btn => btn.classList.remove('active'));

    // Activate selected tab & matching buttons
    const activeTab = document.getElementById(targetId);
    if (activeTab) {
      activeTab.classList.add('active');
      document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => btn.classList.add('active'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delegate click events for tab triggers
  document.addEventListener('click', (e) => {
    const targetBtn = e.target.closest('[data-target]');
    if (targetBtn) {
      const targetTabId = targetBtn.getAttribute('data-target');
      switchTab(targetTabId);
    }
  });
}

// Dynamic PWA Home Screen Banner Alert
function initPWAInstallPrompt() {
  let deferredPrompt;
  const pwaBanner = document.getElementById('pwaBanner');
  const installBtn = document.getElementById('pwaInstallBtn');
  const closeBtn = document.getElementById('pwaCloseBtn');
  const pwaInstruction = document.getElementById('pwaInstruction');

  // Detect iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  if (isIOS) {
    pwaBanner.style.display = 'flex';
    pwaInstruction.textContent = 'Tap Share button (iOS) and select "Add to Home Screen"';
    installBtn.style.display = 'none';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    pwaBanner.style.display = 'flex';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          pwaBanner.style.display = 'none';
        }
        deferredPrompt = null;
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      pwaBanner.style.display = 'none';
    });
  }
}

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

// Fetch Staff Directory with Local Storage Caching
async function loadStaffData() {
  const staffGrid = document.getElementById('staffGrid');
  if (!staffGrid) return;

  const cached = localStorage.getItem('kpembe_staff');
  if (cached) renderStaff(JSON.parse(cached));

  const res = await postData({ action: 'getStaff' });
  if (res.status === 'success' && res.data.length > 0) {
    localStorage.setItem('kpembe_staff', JSON.stringify(res.data));
    renderStaff(res.data);
  }
}

function renderStaff(data) {
  const staffGrid = document.getElementById('staffGrid');
  staffGrid.innerHTML = '';
  data.forEach(stf => {
    staffGrid.innerHTML += `
      <div class="card" style="text-align:center;">
        <img src="${stf.PhotoURL}" alt="${stf.Name}" class="zoomable" style="width:90px; height:90px; border-radius:50%; object-fit:cover; margin-bottom:0.5rem; border:3px solid var(--light-orange);">
        <h4>${stf.Name}</h4>
        <p style="font-size:0.8rem; color:var(--muted-text);">${stf.Email}</p>
        <p style="margin-top:0.5rem; font-size:0.85rem;">${stf.Bio}</p>
      </div>
    `;
  });
}

// Fetch News Items with Local Storage Caching
async function loadNewsData() {
  const newsGrid = document.getElementById('newsGrid');
  if (!newsGrid) return;

  const cached = localStorage.getItem('kpembe_news');
  if (cached) renderNews(JSON.parse(cached));

  const res = await postData({ action: 'getNews' });
  if (res.status === 'success' && res.data.length > 0) {
    localStorage.setItem('kpembe_news', JSON.stringify(res.data));
    renderNews(res.data);
  }
}

function renderNews(data) {
  const newsGrid = document.getElementById('newsGrid');
  newsGrid.innerHTML = '';
  data.forEach(item => {
    newsGrid.innerHTML += `
      <div class="card">
        <img src="${item.ImageURL}" class="zoomable" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-sm); margin-bottom:0.8rem;">
        <h4>${item.Title}</h4>
        <small style="color:var(--muted-text);">${item.Date}</small>
        <p style="margin-top:0.5rem; font-size:0.9rem;">${item.Content}</p>
      </div>
    `;
  });
}

// Button Loader Helper
function setLoadingState(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');
  if (isLoading) {
    button.disabled = true;
    if (btnText) btnText.style.opacity = '0.5';
    if (spinner) spinner.style.display = 'inline-block';
  } else {
    button.disabled = false;
    if (btnText) btnText.style.opacity = '1';
    if (spinner) spinner.style.display = 'none';
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
