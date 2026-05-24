const menuBtn = document.querySelector("#menuBtn");
const nav = document.querySelector("#nav");

menuBtn?.addEventListener("click", () => nav.classList.toggle("open"));

document.querySelectorAll(".nav a").forEach((link) => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("show");
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
