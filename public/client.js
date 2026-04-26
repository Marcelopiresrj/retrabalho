// Global state for data
let currentData = [];

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Excel Import Listener
    const excelInput = document.getElementById('excel-input');
    excelInput.addEventListener('change', handleExcelImport);

    // Navigation Listener
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.getAttribute('data-view');
            switchView(viewName);
        });
    });
});

function switchView(viewName) {
    // Update Active Link
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });

    // Update Visible View
    document.querySelectorAll('.view').forEach(view => {
        view.style.display = 'none';
    });
    document.getElementById(`view-${viewName}`).style.display = 'block';
    
    // Refresh icons
    lucide.createIcons();
}

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
            currentData = recordsData.data; // Update global state
            const tableBody = document.querySelector('#records-table tbody');
            tableBody.innerHTML = '';

            // Unique cities count
            const cities = new Set();
            
            currentData.forEach(record => {
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

function exportToExcel() {
    if (currentData.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(currentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `Relatorio_Manutencoes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

async function clearDatabase() {
    if (!confirm('VOCÊ TEM CERTEZA? Isso apagará TODOS os registros do banco de dados permanentemente.')) {
        return;
    }

    const password = prompt('Digite a senha de segurança (admin) para confirmar:');
    if (password !== 'admin') {
        alert('Senha incorreta.');
        return;
    }

    try {
        const response = await fetch('/clear-database', { method: 'POST' });
        const result = await response.json();
        
        if (result.status === 'success') {
            alert('Banco de dados limpo com sucesso!');
            loadData();
            switchView('dashboard');
        } else {
            alert('Erro ao limpar banco: ' + result.message);
        }
    } catch (error) {
        console.error('Error clearing database:', error);
        alert('Erro de conexão.');
    }
}
