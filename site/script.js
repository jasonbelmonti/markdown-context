const copyButtons = document.querySelectorAll("[data-copy-target]");

for (const button of copyButtons) {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-copy-target");
    const target = targetId ? document.getElementById(targetId) : null;
    const text = target?.textContent?.trim();

    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      const previousLabel = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = previousLabel;
      }, 1400);
    } catch {
      button.textContent = "Select";
    }
  });
}
