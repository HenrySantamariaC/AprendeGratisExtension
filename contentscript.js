console.log("Ejecutando el content script 0.1.0");

async function esperar(time) {
  await new Promise((resolve) => setTimeout(resolve, time));
}

async function waitForSelector(selector) {
  let status = false;
  while (!status) {
    const elemento = document.querySelector(selector);
    elemento ? (status = true) : await esperar(100);
  }
}

async function waitForNotIncludedClass(selector, classLabel) {
  let status = false;
  while (!status) {
    const elemento = document.querySelector(selector);
    !elemento.className.includes(classLabel)
      ? (status = true)
      : await esperar(100);
  }
}

async function getJobsList() {
  await waitForSelector(".components__post-block");
  let listCardJobs = [...document.querySelectorAll(".components__post-block")];
  let jobs = listCardJobs.map((item) => {
    let link = item.querySelector("a").href;
    return { link };
  });
  console.log(jobs);
  return jobs;
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(async function ({ message }) {
    if (message === "getJobs") {
      portBackground.postMessage({ message: "startscrap" });
    }
  });

  const portBackground = chrome.runtime.connect({ name: "content-background" });

  portBackground.onMessage.addListener(async ({ message, data }) => {
    if (message == "nextpage") {
      const nextPageButton = document.querySelector(".loadmore-btn");
      if (nextPageButton) {
        nextPageButton.click();
      }
    }
    if (message == "collectingData") {
      let nextPageButton = document.querySelector(".loadmore-btn");
      let remainingButtom = document.querySelector(".remaining.clearfix");
      while (remainingButtom.innerText !== "NO HAY MÁS CURSOS") {
        nextPageButton.click();
        await waitForNotIncludedClass(".loadmore-btn", "loading");
      }
      console.log("unbucle");
      const jobs = await getJobsList();
      portBackground.postMessage({ message: "finish", data: jobs });
    }
    if (message == "resume") {
      port.postMessage({ message: "end", data });
    }
  });
});
