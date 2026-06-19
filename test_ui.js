const fs = require('fs');
const html = fs.readFileSync('frontend/admin/products.html', 'utf8');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

// Mock localStorage
window.localStorage.getItem = () => "fake_token";

// Mock fetch
window.fetch = async (url, options) => {
  console.log("FETCH:", url, options.method);
  return { ok: true };
};

// Mock variables
window.editingId = 11;
document.getElementById("productId").value = "11";
document.getElementById("name").value = "Test";
document.getElementById("price").value = "100";
document.getElementById("stock").value = "10";

// Call saveProduct
window.saveProduct().then(() => {
  console.log("saveProduct finished");
}).catch(e => {
  console.error("saveProduct crashed:", e);
});
