const tableHeaders = {
    name: 'Név',
    display: 'Kijelző',
    displaySizeInches: 'Kijelző méret (col)',
    cpu: 'CPU',
    gpuFull: 'Elsődleges GPU',
    ramSize: 'Memória méret (GB)',
    ramType: 'Memória típus',
    cpuBenchmarkMatchName: 'Felismert CPU',
    cpuBenchmarkMatchMark: 'Felismert processzor CPU',
    gpuBenchmarkMatchName: 'Felismert elsődleges GPU',
    gpuBenchmarkMatchMark: 'Felismert elsődleges GPU pontszám',
    storage1Size: 'Tárhely 1 méret (GB)',
    storage1Type: 'Tárhely 1 típus',
    storage2Size: 'Tárhely 2 méret (GB)',
    storage2Type: 'Tárhely 2 típus',
    price: 'Ár',
    link: 'Link'
};

const tableColumnOrder = ['name', 'display', 'displaySizeInches', 'cpu',
    'cpuBenchmarkMatchName', 'cpuBenchmarkMatchMark',
    'gpuFull', 'gpuBenchmarkMatchName', 'gpuBenchmarkMatchMark',
    'ramSize', 'ramType',
    'storage1Size', 'storage1Type', 'storage2Size', 'storage2Type',
    'price', 'link'];

const nrdHuRootUrl = 'https://nrd.hu/';

const statusEl = document.getElementById('status');

function run() {

    const parser = new DOMParser();

    const docNrdHu = parser.parseFromString(document.getElementById('nrdhu-html').value, "text/html");
    const docCpubenchmarkNet = parser.parseFromString(document.getElementById('cpubenchmarknet-html').value, "text/html");
    const docVideocardbenchmarkNet = parser.parseFromString(document.getElementById('videocardbenchmarknet-html').value, "text/html");

    const docProducts = docNrdHu.querySelectorAll('.productdiv');
    const docBenchmarks = {
        cpu: docCpubenchmarkNet.querySelectorAll('#cputable tbody tr[role=row]'),
        gpu: docVideocardbenchmarkNet.querySelectorAll('#cputable tbody tr[role=row]')
    };

    let benchmarks = {};

    for (const benchmarkType in docBenchmarks) {
        benchmarks[benchmarkType] = [];
        for (const i in docBenchmarks[benchmarkType]) {
            if (docBenchmarks[benchmarkType][i].children) {
                const mark = parseInt(docBenchmarks[benchmarkType][i].children[1].textContent.replace(/\D/g, ''));

                let name = docBenchmarks[benchmarkType][i].children[0].textContent;
                if (benchmarkType === 'gpu' && name.toLowerCase().includes('intel')) {
                    name = name.replaceAllCI('graphics', '').replaceAll('  ', ' ');
                }
                name.replaceAllCI('Ati ', '').replaceAllCI('AMD ', '').replaceAllCI('Nvidia ', '');

                if (!isNaN(mark)) {
                    benchmarks[benchmarkType].push({
                        name: name,
                        mark: mark
                    });
                }

            }
        }

    }

    document.getElementById('nrdhu-parse-result').textContent = docProducts.length + ' db termék betöltve.';
    document.getElementById('cpubenchmarknet-parse-result').textContent = benchmarks.cpu.length + ' db CPU betöltve.';
    document.getElementById('videocardbenchmarknet-parse-result').textContent = benchmarks.gpu.length + ' db GPU betöltve.';

    let products = [];

    for (const i in docProducts) {

        if (docProducts[i].querySelector) {

            let product = {};

            let nameAndPrice = docProducts[i].querySelector('h3 [class$="tnev"]').textContent.trim().split(' - ');
            product.name = nameAndPrice[0];
            product.price = nameAndPrice[1].replace(/\D/g, '');

            let linkParts = docProducts[i].querySelector('h3 a').href.split('/');
            product.link = linkParts[linkParts.length - 1];


            product.display = docProducts[i].querySelector('td[class$="tlcd"]').textContent.replace('Kijelző mérete:', '').trim();

            product.displaySizeInches = product.display.split('"')[0].replaceAll('.', ',');

            product.cpu = docProducts[i].querySelector('td[class$="tcpu"]').textContent.replace('Processzor:', '').replaceAll('!', '').trim();

            const ram = docProducts[i].querySelector('td[class$="tram"]').textContent.replace('Memória:', '').replaceAll('!', '').trim().split(' ');
            product.ramSize = ram[0].replace(/\D/g, '');
            product.ramType = ram[1];


            const storages = docProducts[i].querySelector('td[class$="thdd"]').textContent.replace('Winchester:', '').replaceAll('!', '').trim().split('+');

            for (const j in storages) {
                const storage = storages[j].split('GB');
                product['storage' + (parseInt(j) + 1) + 'Size'] = storage[0].replace(/\D/g, '');
                if (storage[1].trim().includes('SSD')) {
                    product['storage' + (parseInt(j) + 1) + 'Type'] = 'SSD';
                } else {
                    product['storage' + (parseInt(j) + 1) + 'Type'] = 'HDD';
                }

            }

            let gpu = docProducts[i].querySelector('td[class$="tgpu"]').textContent.replace('Videókártya:', '').replaceAll('!', '');
            product.gpuFull = gpu;
            // do some further processing to incresase match chances
            gpu = gpu.split('+')[0].trim(); // only keep primary GPU if dual
            gpu = gpu.split(' / ')[0].trim(); // ignore RAM details
            gpu = gpu.replaceAllCI('Ati ', '').replaceAllCI('AMD ', '').replaceAllCI('Nvidia ', '');
            gpu = gpu.toLowerCase().includes('intel') ? gpu.replaceAllCI('graphics', '').replaceAll('  ', ' ') : gpu;
            gpu = gpu.startsWith('1x ') ? gpu.substr(3) : gpu;

            product.gpu = gpu;

            products.push(product);
        }
    }

    console.log(products);
    console.log(benchmarks);

    if (window.Worker) {

        const myWorker = new Worker("assets/app/js/worker.js");
        console.log('Starting worker.');

        myWorker.onmessage = function (e) {
            if (e.data.hasOwnProperty('progress')) {
                console.log('Progress: ' + e.data.progress);
                statusEl.textContent = "Feldolgozva: " + e.data.progress;
            } else if (e.data.hasOwnProperty('results')) {
                console.log('Worker finished with results:');
                console.log(e.data.results);
                statusEl.textContent = "Kész! Táblázat kijelölve, másolható a vágólapra.";
                renderResultsTable(e.data.results);
            }
        };

        myWorker.postMessage({
            benchmarks: benchmarks,
            products: products
        });

    } else {
        alert('JavaScript worker támogatás szükséges, sajnos a böngésződ nem tudja.');
    }

}

function renderResultsTable(results) {
    let resultsTableHTML = '<table>';

    resultsTableHTML += '<tr>';

    for (const i in tableColumnOrder) {
        resultsTableHTML += '<th>' + tableHeaders[tableColumnOrder[i]] + '</th>';
    }
    resultsTableHTML += '</tr>';

    for (const i in results) {
        resultsTableHTML += '<tr>';
        for (const j in tableColumnOrder) {
            resultsTableHTML += '<td>';

            if (tableColumnOrder[j] === 'name') {
                resultsTableHTML += '<a target="_blank" href="' + nrdHuRootUrl + results[i].link + '">';
                resultsTableHTML += results[i][tableColumnOrder[j]];
                resultsTableHTML += '</a>';
            } else if (tableColumnOrder[j] === 'link') {
                resultsTableHTML += '<a target="_blank" href="' + nrdHuRootUrl + results[i].link + '">';
                resultsTableHTML += nrdHuRootUrl + results[i][tableColumnOrder[j]];
                resultsTableHTML += '</a>';
            } else {
                resultsTableHTML += results[i].hasOwnProperty(tableColumnOrder[j]) ? results[i][tableColumnOrder[j]] : '';
            }

            resultsTableHTML += '</td>';
        }
        resultsTableHTML += '</tr>';
    }

    resultsTableHTML += '</table>';
    document.getElementById('table-results').innerHTML = resultsTableHTML;
    selectElementContents(document.getElementById('table-results'));
}