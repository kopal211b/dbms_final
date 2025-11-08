// Click handlers for Student & Teacher
document.getElementById('studentBtn')?.addEventListener('click', () => {
  window.location.href = '/student';
});

document.getElementById('teacherBtn')?.addEventListener('click', () => {
  window.location.href = '/teacher';
});

// Admin modal open trigger
const adminBtn = document.getElementById('openAdminLogin');
const modal = document.getElementById('adminLoginModal');
const closeEls = document.querySelectorAll('[data-close="true"]');

function showModal(){ modal.classList.add('show'); }
function hideModal(){ modal.classList.remove('show'); }

adminBtn?.addEventListener('click', showModal);
closeEls.forEach(el => el.addEventListener('click', hideModal));


function showModal(){
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function hideModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

// open modal events
openAdminLogin?.addEventListener('click', showModal);
adminBtn?.addEventListener('click', showModal);

// close events
closeEls.forEach(el => el.addEventListener('click', hideModal));
modal?.addEventListener('click', (e)=>{ if(e.target.classList.contains('modal-backdrop')) hideModal(); });

document.querySelectorAll('.role-card').forEach(card => {
  const target = card.getAttribute('data-target');
  if (!target) return;

  // only allow direct redirect if not admin card
  if (target !== '/admin-panel') {
    card.addEventListener('click', () => window.location.href = target);
    card.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = target;
      }
    });
  }
});

// ADMIN LOGIN SUBMIT HANDLER
document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('adminLoginError');
  err.style.display = 'none';

  const form = e.currentTarget;
  const formData = new FormData(form);

  try {
    const resp = await fetch('/admin_auth', { method: 'POST', body: formData });
    const data = await resp.json();

    if (resp.ok && data && data.ok) {
      window.location.href = '/admin';
    } else {
      err.textContent = data?.message || 'Invalid credentials';
      err.style.display = 'block';
    }
  } catch {
    err.textContent = 'Network error. Try again.';
    err.style.display = 'block';
  }
});
