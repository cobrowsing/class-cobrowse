function init() {
  const accept = document.querySelector("#accept");
  const params = new URL(location.href).searchParams;
  accept.addEventListener("click", () => {
    browser.runtime.sendMessage({
      type: "inviteAccepted",
      classId: params.get("class"),
    });
  });
}

init();
