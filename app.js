// app.js
document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll('.plan-button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(() => {
                window.location.href = "unauthorized.html";
            }, 5000); // 5 second delay
        });
    });
});