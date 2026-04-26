async function loadData() {
    try {
        // Fetch stats
        const statsRes = await fetch('/stats');
        const statsData = await statsRes.json();
        
        if (statsData.status === 'success') {
            document.getElementById('total-count').textContent = statsData.data.total;
            document.getElementById('sla-count').textContent = statsData.data.sla_cumprido;
        }

        // Fetch records
        const recordsRes = await fetch('/manutencoes');
        const recordsData = await recordsRes.json();

        if (recordsData.status === 'success') {
            const tableBody = document.querySelector('#records-table tbody');
            tableBody.innerHTML = '';

            // Unique cities count
            const cities = new Set();
            
            recordsData.data.forEach(record => {
                cities.add(record.cidade);
                
                const row = document.createElement('tr');
                const dataFormatada = new Date(record.data_manutencao).toLocaleDateString('pt-BR');
                
                row.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${record.cidade}/${record.estado}</td>
                    <td>${record.nome_ci}</td>
                    <td>${record.categoria}</td>
                    <td><span class="badge ${record.cumplimento_sla === 'Dentro' ? 'sla-ok' : 'sla-late'}">${record.cumplimento_sla}</span></td>
                    <td><span class="badge ${record.is_rework ? 'rework' : 'normal'}">${record.is_rework ? 'Sim' : 'Não'}</span></td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('city-count').textContent = cities.size;
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Excel Import Listener
    const excelInput = document.getElementById('excel-input');
    excelInput.addEventListener('change', handleExcelImport);
});

async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Parsed Excel:', jsonData);

        if (jsonData.length === 0) {
            alert('A planilha está vazia!');
            return;
        }

        // Map fields and send to backend
        try {
            const response = await fetch('/batch-insert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: jsonData })
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert(`${result.count} registros importados com sucesso!`);
                loadData();
            } else {
                alert('Erro na importação: ' + result.message);
            }
        } catch (error) {
            console.error('Error uploading excel:', error);
            alert('Erro ao enviar dados para o servidor.');
        }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input
    event.target.value = '';
}
