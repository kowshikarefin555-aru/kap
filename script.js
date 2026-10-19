// ========== NAVBAR ==========
const navbar = document.getElementById('mainNav');
const navMenu = document.getElementById('navMenu');

// স্ক্রল করলে navbar এ ব্যাকগ্রাউন্ড আসবে
function handleNavbarScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}
window.addEventListener('scroll', handleNavbarScroll);
handleNavbarScroll(); // পেজ লোড হওয়ার সময়ও একবার চেক

// মোবাইলে কোনো লিংকে ক্লিক করলে মেনু নিজে থেকে বন্ধ হবে
document.querySelectorAll('#navMenu .nav-link, #navMenu .btn').forEach((item) => {
  item.addEventListener('click', () => {
    if (navMenu.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
    }
  });
});


// ========== HERO: টাইপিং অ্যানিমেশন ==========
const typedEl = document.getElementById('typed-text');
const roles = ['Student', 'Web Developer', 'Designer']; // এখানে লেখা বদলাতে পারবে

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
  const current = roles[roleIndex];

  charIndex += isDeleting ? -1 : 1;
  typedEl.textContent = current.substring(0, charIndex);

  let delay = isDeleting ? 60 : 110;

  if (!isDeleting && charIndex === current.length) {
    delay = 1600;        // পুরো লেখা হলে একটু থামবে
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 400;         // পরের লেখা শুরুর আগে ছোট বিরতি
  }

  setTimeout(typeEffect, delay);
}

if (typedEl) typeEffect();


// ========== স্ক্রল করলে ভেসে ওঠার অ্যানিমেশন (About, Skills সব জায়গায় কাজ করবে) ==========
document.documentElement.classList.add('js-enabled');

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // একবার দেখানো হলে আর দেখার দরকার নেই
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));


// ========== ABOUT: সংখ্যা গুনে গুনে বাড়ার কাউন্টার ==========
const banglaNumber = new Intl.NumberFormat('bn-BD'); // ১, ২, ৩ এভাবে বাংলা সংখ্যায় দেখাবে

function animateCounter(el) {
  const target = Number(el.dataset.count);
  const duration = 1500; // মিলিসেকেন্ড
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = banglaNumber.format(Math.floor(progress * target));
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = banglaNumber.format(target);
    }
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));
// ========== PROJECTS: ফিল্টার বাটন ==========
const filterButtons = document.querySelectorAll('.filter-btn');
const projectItems = document.querySelectorAll('.project-item');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    // বাটনের active দাগ সরানো
    filterButtons.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;

    projectItems.forEach((item) => {
      const show = filter === 'all' || item.dataset.category === filter;
      item.classList.toggle('d-none', !show);

      if (show) {
        item.classList.add('visible');   // স্ক্রলের অপেক্ষা না করে সরাসরি দেখাবে
        item.classList.remove('pop');
        void item.offsetWidth;           // অ্যানিমেশন আবার চালানোর কৌশল
        item.classList.add('pop');
      }
    });
  });
});
// ========== CONTACT: ফর্ম পাঠানো ==========
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  const sendBtn = document.getElementById('sendBtn');
  const btnText = sendBtn.querySelector('.btn-text');
  const statusEl = document.getElementById('formStatus');

  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'form-status ' + type;
  }

  // ফর্মের ঘরগুলো ঠিক না থাকলে ব্রাউজার নিজেই আটকে দেবে, তখন এই কোড চলবে না
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(contactForm));

    sendBtn.disabled = true;
    btnText.textContent = 'পাঠানো হচ্ছে...';
    showStatus('একটু অপেক্ষা করো...', 'info');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();

      if (response.ok && result.ok) {
        showStatus(result.message, 'success');
        contactForm.reset();
      } else {
        showStatus(result.message || 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করো।', 'error');
      }
    } catch (error) {
      showStatus('সার্ভারের সাথে যোগাযোগ হয়নি। সার্ভার চালু আছে কিনা দেখো।', 'error');
    } finally {
      sendBtn.disabled = false;
      btnText.textContent = 'মেসেজ পাঠাও';
    }
  });
}


// ========== FOOTER: সাল নিজে থেকে বদলাবে ==========
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Intl.NumberFormat('bn-BD', { useGrouping: false }).format(new Date().getFullYear());
}