// Función para obtener datos del backend (REST API punto 4)
async function fetchTemperaturas() {
  const response = await fetch('http://localhost:4000/temperaturas');
  const data = await response.json();
  return data;
}

// Prepara los datasets para Chart.js
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
  }));
}

let chart; // guardamos la referencia al gráfico

// Crear o actualizar gráfico
async function crearGrafico() {
  const data = await fetchTemperaturas();
  const datasets = prepararDatos(data);

  const ctx = document.getElementById('tempChart').getContext('2d');

  if (chart) {
    // Si ya existe, actualizamos datasets
    chart.data.datasets = datasets;
    chart.update();
  } else {
    // Si no existe, lo creamos
    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        parsing: {
          xAxisKey: 'x',
          yAxisKey: 'y'
        },
        scales: {
          x: { 
            type: 'time',
            time: { unit: 'minute', tooltipFormat: 'yyyy-MM-dd HH:mm' },
            title: { display: true, text: 'Fecha / Hora (UTC)' }
          },
          y: { 
            title: { display: true, text: 'Temperatura (°C)' } 
          }
        }
      }
    });
  }
}

// Ejecutar al cargar y refrescar cada 5s
crearGrafico();
setInterval(crearGrafico, 5000);
