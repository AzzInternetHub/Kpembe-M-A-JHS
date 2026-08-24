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
        name: document.getElementById('resName').value.trim(),
        dob: document.getElementById('resDob').value,
        className: document.getElementById('resClass').value,
        serial: document.getElementById('resSerial').value.trim()
      };

      try {
        const response = await postData(payload);
        setLoadingState(submitBtn, false);
        
        if (response.status === 'success') {
          displayResults(response.result);
        } else {
          alert(response.message || 'No matching result record found.');
        }
      } catch (err) {
        setLoadingState(submitBtn, false);
        alert('Network connection error. Please try again.');
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

  // Handle PDF Export Action with Mobile & CORS Canvas Fix
  const pdfBtn = document.getElementById('downloadPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      const element = document.getElementById('pdfContent');
      
      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right in inches
        filename:     'Kpembe_JHS_Result_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,           
          allowTaint: true,        
          logging: false,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      const originalText = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '⏳ Generating PDF...';
      pdfBtn.disabled = true;

      html2pdf().set(opt).from(element).save().then(() => {
        pdfBtn.innerHTML = originalText;
        pdfBtn.disabled = false;
      }).catch(err => {
        console.error('PDF Generation Error:', err);
        alert('Could not generate PDF directly. Taking a screenshot is recommended on this browser.');
        pdfBtn.innerHTML = originalText;
        pdfBtn.disabled = false;
      });
    });
  }
});

// Tab Navigation Manager
function initTabs() {
  const switchTab = (targetId) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab, .mobile-tab-btn').forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(targetId);
    if (activeTab) {
      activeTab.classList.add('active');
      document.querySelectorAll(`[data-target="${targetId}"]`).forEach(btn => btn.classList.add('active'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    <div style="margin-bottom: 1rem; background: var(--light-bg); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--glass-border);">
      <p style="margin-bottom: 0.2rem;"><strong>Student Name:</strong> ${data.name}</p>
      <p style="margin-bottom: 0.2rem;"><strong>Serial No:</strong> ${data.serial} | <strong>Class:</strong> ${data.className} (${data.year || '2025/2026'})</p>
      <p><strong>Date of Birth:</strong> ${data.dob}</p>
    </div>
  `;

  if (data.subjects && data.subjects.length > 0) {
    tbody.innerHTML = data.subjects.map(sub => `
      <tr>
        <td style="font-weight: 600;">${sub.title}</td>
        <td>${sub.ca}</td>
        <td>${sub.exam}</td>
        <td style="font-weight: 700; color: var(--primary-orange);">${sub.total}</td>
        <td><strong>${sub.grade}</strong></td>
        <td>${sub.remark || sub.interp}</td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No subject results found.</td></tr>`;
  }

  summaryDiv.innerHTML = `
    <div style="margin-top: 1rem; padding: 0.85rem; background: var(--light-orange); border-radius: var(--radius-sm); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
      <p><strong>Overall Total Score:</strong> ${data.totalScore}</p>
      <p><strong>Class Rank Position:</strong> ${data.position}</p>
    </div>
  `;

  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
}

// Fullscreen Image Lightbox
function initImageLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  document.body.addEventListener('click', (e) => {
    const targetImg = e.target.closest('.zoomable') || (e.target.tagName === 'IMG' && e.target.closest('.img-preview-container'));
    if (targetImg) {
      lightboxImg.src = targetImg.tagName === 'IMG' ? targetImg.src : targetImg.querySelector('img').src;
      lightbox.style.display = 'flex';
    }
  });

  lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
  });
}

// Fetch Staff Directory with Local Storage Caching & Image Preview Visuals
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
  staffGrid.innerHTML = data.map(stf => `
    <div class="card" style="text-align:center;">
      <div class="img-preview-container" style="display:inline-block; position:relative;">
        <img src="${stf.PhotoURL}" alt="${stf.Name}" class="zoomable" style="width:95px; height:95px; border-radius:50%; object-fit:cover; border:3px solid var(--light-orange);">
        <span class="photo-hint-badge">🔍 View</span>
      </div>
      <h4 style="margin-top:0.4rem;">${stf.Name}</h4>
      <p style="font-size:0.8rem; color:var(--muted-text);">${stf.Email}</p>
      <p style="margin-top:0.5rem; font-size:0.85rem;">${stf.Bio}</p>
    </div>
  `).join('');
}

// Fetch News Items with Optional Image Rendering & Local Storage Caching
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
  newsGrid.innerHTML = data.map(item => {
    const hasImage = item.ImageURL && item.ImageURL.trim() !== '';
    const imageHTML = hasImage ? `
      <div class="img-preview-container" style="position:relative; margin-bottom:0.8rem;">
        <img src="${item.ImageURL}" class="zoomable" style="width:100%; height:160px; object-fit:cover; border-radius:var(--radius-sm); display:block;">
        <span class="photo-hint-badge">🔍 Click photo to expand</span>
      </div>
    ` : '';

    return `
      <div class="card">
        ${imageHTML}
        <h4>${item.Title}</h4>
        <small style="color:var(--muted-text);">${item.Date}</small>
        <p style="margin-top:0.5rem; font-size:0.9rem;">${item.Content}</p>
      </div>
    `;
  }).join('');
}

// Button Loader Helper
function setLoadingState(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const spinner = button.querySelector('.spinner');
  if (isLoading) {
    button.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline-block';
  } else {
    button.disabled = false;
    if (btnText) btnText.style.display = 'inline';
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
