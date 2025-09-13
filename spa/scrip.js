const loginContainer = document.getElementById('loginContainer');
const chartsContainer = document.getElementById('chartsContainer');
const loginForm = document.getElementById('loginForm');
const errorP = document.getElementById('error');
const filtroCiudad = document.getElementById('filtroCiudad'); 
let chart; // referencia al gráfico
let datosCompletos = []; // para filtrar sin volver a fetch

//LOGIN 
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    // login
    const res = await fetch('https://auth-12mf.onrender.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Usuario o contraseña incorrectos');

    const data = await res.json();
    localStorage.setItem('token', data.token);

    // Mostrar la sección de gráficos
    loginContainer.style.display = 'none';
    chartsContainer.style.display = 'block';
    crearGrafico(); 
    setInterval(crearGrafico, 1000000);

  } catch (err) {
    errorP.textContent = err.message;
  }
});

//FUNCIONES PARA GRÁFICO 
async function fetchTemperaturas() {
  const token = localStorage.getItem('token');

  // Fetch desde REST API en Render
  const response = await fetch('https://rest-api-db.onrender.com/temperatura_api', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Error al obtener datos. ¿Tu token expiró?');
  }

  const data = await response.json();
  return data;
}

// datasets para Chart.js
function prepararDatos(data) {
  const cities = ['Shangai', 'Berlin', 'Rio de Janeiro'];
  const colores = {
    Shangai: 'rgb(255, 99, 132)',
    Berlin: 'rgb(54, 162, 235)',
    'Rio de Janeiro': 'rgb(75, 192, 192)'
  };

  return cities.map(city => ({
    label: city,
    data: data
      .filter(d => d.city === city)
      .map(d => ({ x: d.timestamp, y: d.temperature })),
    borderColor: colores[city],
    fill: false,
    tension: 0.1
  })).filter(ds => ds.data.length > 0); 
}

// Actualizar KPIs
function actualizarKPIs(data) {
  const total = data.length;
  const shangai = data.filter(d => d.city === 'Shangai').length;
  const berlin = data.filter(d => d.city === 'Berlin').length;
  const rio = data.filter(d => d.city === 'Rio de Janeiro').length;

  const temperaturas = data.map(d => d.temperature);
  const tempMax = temperaturas.length ? Math.max(...temperaturas) : 0;
  const tempMin = temperaturas.length ? Math.min(...temperaturas) : 0;

  document.getElementById('totalDatos').textContent = total;
  document.getElementById('totalShangai').textContent = shangai;
  document.getElementById('totalBerlin').textContent = berlin;
  document.getElementById('totalRio').textContent = rio;
  document.getElementById('tempMax').textContent = tempMax;
  document.getElementById('tempMin').textContent = tempMin;
}

// Crear o actualizar gráfico
async function crearGrafico() {
  try {
    const data = await fetchTemperaturas();
    datosCompletos = data; 

    const ciudadSeleccionada = filtroCiudad.value;
    const dataFiltrada = ciudadSeleccionada === 'all'
      ? data
      : data.filter(d => d.city === ciudadSeleccionada);

    // KPIs según filtro
    actualizarKPIs(dataFiltrada);

    const datasets = prepararDatos(dataFiltrada);
    const ctx = document.getElementById('tempChart').getContext('2d');

    if (chart) {
      chart.data.datasets = datasets;
      chart.update();
    } else {
      chart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          parsing: { xAxisKey: 'x', yAxisKey: 'y' },
          scales: {
            x: {
              type: 'time',
              time: { unit: 'minute', tooltipFormat: 'yyyy-MM-dd HH:mm' },
              title: { display: true, text: 'Fecha / Hora (UTC)' }
            },
            y: { title: { display: true, text: 'Temperatura (°C)' } }
          }
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
}

// FILTRO 
filtroCiudad.addEventListener('change', () => {
  crearGrafico(); // usa datosCompletos y aplica filtro
});

// AUTOLOGIN SI YA HAY TOKEN 
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

const savedToken = localStorage.getItem('token');
if (isTokenValid(savedToken)) {
  loginContainer.style.display = 'none';
  chartsContainer.style.display = 'block';
  crearGrafico();
  setInterval(crearGrafico, 1000000);
} else {
  localStorage.removeItem('token'); // borrar token expirado
}
