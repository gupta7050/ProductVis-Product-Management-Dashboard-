const products = {
  stock: [],
  ordered: [],
  sold: [],
  haveToOrder: []
};

let pieChart = null;

document.addEventListener("DOMContentLoaded", () => {
  loadDataFromStorage();
  renderPieChart();
  populateAllTables();

  document.querySelectorAll(".productForm").forEach(form => {
    form.addEventListener("submit", handleFormSubmit);
  });
});

function handleFormSubmit(e) {
  e.preventDefault();

  const category = e.target.getAttribute("data-category");
  const inputs = e.target.querySelectorAll("input");
  const name = inputs[0].value.trim();
  const qty = parseInt(inputs[1].value);

  if (name && qty > 0) {
    products[category].push({ name, quantity: qty });
    saveDataToStorage();
    populateTable(category);
    renderPieChart();
    e.target.reset();
  } else {
    alert("Please enter a valid product and quantity.");
  }
}

function renderPieChart() {
  const ctx = document.getElementById('pieChart').getContext('2d');
  const stockSum = sumQuantities(products.stock);
  const orderedSum = sumQuantities(products.ordered);
  const soldSum = sumQuantities(products.sold);
  const haveToOrderSum = sumQuantities(products.haveToOrder);

  const dataValues = [stockSum, orderedSum, soldSum, haveToOrderSum];
  const total = dataValues.reduce((a, b) => a + b, 0);

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Stock', 'Ordered', 'Sold', 'Have To Order'],
      datasets: [{
        data: dataValues,
        backgroundColor: ['#00a8ff', '#fbc531', '#e84118', '#9c88ff']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        },
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 14
          },
          formatter: (value) => {
            if (total === 0) return "0%";
            const percentage = (value / total * 100).toFixed(1);
            return percentage + "%";
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

function sumQuantities(arr) {
  return arr.reduce((acc, curr) => acc + curr.quantity, 0);
}

function populateTable(category) {
  const tableBody = document.getElementById(`${category}Table`);
  const data = products[category];
  let html = "";

  data.forEach((item, index) => {
    html += `
      <tr>
        <td>${item.name}</td>
        <td>
          <span id="${category}-qty-${index}">${item.quantity}</span>
          <input 
            type="number" 
            id="${category}-input-${index}" 
            value="${item.quantity}" 
            style="display:none; width: 60px; padding: 5px; font-size: 14px;"
          />
        </td>
        <td>
          <button onclick="startEdit('${category}', ${index})" style="background-color:#f39c12; color:#fff; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Edit</button>
          <button onclick="saveEdit('${category}', ${index})" id="${category}-save-btn-${index}" style="background-color:#27ae60; color:#fff; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; display:none;">Save</button>
          <button onclick="deleteProduct('${category}', ${index})" style="background-color:#e84118; color:#fff; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Delete</button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

function populateAllTables() {
  Object.keys(products).forEach(populateTable);
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}

function deleteProduct(category, index) {
  if (confirm("Are you sure you want to delete this product?")) {
    products[category].splice(index, 1);
    saveDataToStorage();
    populateTable(category);
    renderPieChart();
  }
}

function startEdit(category, index) {
  document.getElementById(`${category}-qty-${index}`).style.display = "none";
  const input = document.getElementById(`${category}-input-${index}`);
  input.style.display = "inline-block";
  input.focus();
  document.getElementById(`${category}-save-btn-${index}`).style.display = "inline-block";
}

function saveEdit(category, index) {
  const input = document.getElementById(`${category}-input-${index}`);
  const newQty = parseInt(input.value);

  if (!isNaN(newQty) && newQty > 0) {
    products[category][index].quantity = newQty;
    saveDataToStorage();
    populateTable(category);
    renderPieChart();
  } else {
    alert("Please enter a valid quantity.");
  }
}

function saveDataToStorage() {
  localStorage.setItem("productVisData", JSON.stringify(products));
}

function loadDataFromStorage() {
  const stored = localStorage.getItem("productVisData");
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.keys(products).forEach(cat => {
      products[cat] = parsed[cat] || [];
    });
  }
}

/* Download Excel functionality */
function downloadExcel() {
  let csv = "Category,Product,Quantity\n";

  Object.keys(products).forEach(category => {
    products[category].forEach(item => {
      csv += `${category},${item.name},${item.quantity}\n`;
    });
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "products.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* Download PDF functionality */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Product Data Report", 14, 20);

  let startY = 30;

  Object.keys(products).forEach(category => {
    const data = products[category];

    if (data.length === 0) {
      return;
    }

    doc.setFontSize(16);
    doc.text(category.toUpperCase(), 14, startY);

    const rows = data.map(item => [item.name, item.quantity]);

    doc.autoTable({
      head: [['Product', 'Quantity']],
      body: rows,
      startY: startY + 5,
      styles: {
        fontSize: 12
      }
    });

    startY = doc.lastAutoTable.finalY + 10;
  });

  doc.save("products.pdf");
}
