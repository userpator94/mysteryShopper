/** Блокирует кнопку повторной отправки письма на время, чтобы не тратить лимит отправки. */
export function startResendCooldown(btn: HTMLButtonElement, label: string, seconds = 60): void {
  let left = seconds;
  btn.disabled = true;
  btn.textContent = `${label} (${left} с)`;
  const timer = window.setInterval(() => {
    left -= 1;
    if (left <= 0 || !btn.isConnected) {
      window.clearInterval(timer);
      btn.disabled = false;
      btn.textContent = label;
      return;
    }
    btn.textContent = `${label} (${left} с)`;
  }, 1000);
}
