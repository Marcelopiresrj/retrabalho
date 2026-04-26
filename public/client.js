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
            currentData = recordsData.data;
            const tableBody = document.querySelector('#records-table tbody');
            tableBody.innerHTML = '';

            // Analysis
            const cities = new Set();
            const ciCityCounts = {};
            const splitterCityCounts = {};
            
            currentData.forEach(r => {
                if (r.cidade) {
                    if (r.nome_ci) {
                        const key = `${r.cidade.toLowerCase()}|${r.nome_ci.toLowerCase()}`;
                        ciCityCounts[key] = (ciCityCounts[key] || 0) + 1;
                    }
                    if (r.splitter) {
                        const key = `${r.cidade.toLowerCase()}|${r.splitter.toLowerCase()}`;
                        splitterCityCounts[key] = (splitterCityCounts[key] || 0) + 1;
                    }
                }
            });

            // Count unique items that are repeated WITHIN THEIR CITIES
            const repeatedCIs = Object.values(ciCityCounts).filter(count => count > 1).length;
            const repeatedSplitters = Object.values(splitterCityCounts).filter(count => count > 1).length;
            
            document.getElementById('repeated-count').textContent = repeatedCIs + repeatedSplitters;

            currentData.forEach(record => {
                cities.add(record.cidade);
                
                const cityKey = record.cidade ? record.cidade.toLowerCase() : '';
                const isRepeatedCI = record.nome_ci && ciCityCounts[`${cityKey}|${record.nome_ci.toLowerCase()}`] > 1;
                const isRepeatedSplitter = record.splitter && splitterCityCounts[`${cityKey}|${record.splitter.toLowerCase()}`] > 1;
                const isRepeated = isRepeatedCI || isRepeatedSplitter;
                
                const row = document.createElement('tr');
                if (isRepeated) row.style.background = 'rgba(239, 68, 68, 0.05)';
                
                const dataFormatada = new Date(record.data_manutencao).toLocaleDateString('pt-BR');
                
                row.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td><span style="font-family:monospace; font-size:0.75rem;">${record.referencia || '-'}</span></td>
                    <td>${record.estado}</td>
                    <td>${record.cidade}</td>
                    <td>${record.armario}</td>
                    <td>${record.splitter}</td>
                    <td><span style="font-size:0.75rem; color:var(--text-muted);">${record.descricao || ''}</span></td>
                    <td>
                        <span style="font-weight:600; color:var(--primary);">${record.nome_ci}</span>
                        ${isRepeated ? '<br><span class="badge sla-late" style="font-size:0.5rem; padding:2px 6px;">REPETIDA</span>' : ''}
                    </td>
                    <td>${record.categoria}</td>
                    <td>${record.subcategoria}</td>
                    <td>${record.sintoma}</td>
                    <td>${record.causa}</td>
                    <td>
                        <span class="badge ${
                            ['dentro', 'ok', 'no prazo', 'sim', 'dentro do prazo'].includes(String(record.cumplimento_sla).toLowerCase().trim()) 
                            ? 'sla-ok' : 'sla-late'
                        }">
                            ${record.cumplimento_sla}
                        </span>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('city-count').textContent = cities.size;
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get all rows as array of arrays to find header
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Find the index of the first row that looks like a header
        let headerIndex = rows.findIndex(row => 
            row.some(cell => cell && String(cell).toLowerCase().includes('ci')) ||
            row.some(cell => cell && String(cell).toLowerCase().includes('estado'))
        );

        if (headerIndex === -1) headerIndex = 0; // Fallback

        // Convert to JSON starting from that row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });

        console.log('Detected Header Row at index:', headerIndex);
        console.log('Sample data:', jsonData[0]);

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
