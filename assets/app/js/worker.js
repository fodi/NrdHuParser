onmessage = function (e) {

    importScripts('../../fuse.js/js/fuse.min.js');

    let products = e.data.products;
    let benchmarks = e.data.benchmarks;


    const fuseOptions = {
        keys: ['name'],
        shouldSort: true,
        threshold: 0.4
    };



    for (const pi in products) {

        let numbersInCpuName, numbersInGpuName;
        try {
            numbersInCpuName = products[pi].cpu.match(/\d+/g);
            numbersInGpuName = products[pi].gpu.match(/\d+/g);
        } catch (error) {
            console.error(products[pi]);
        }

        let largeNumbersInName = {};

        if (numbersInCpuName) {
            largeNumbersInName.cpu = Math.max(...numbersInCpuName);
        }

        if (numbersInGpuName) {
            largeNumbersInName.gpu = Math.max(...numbersInGpuName);
        }

        let filteredBenchmarks = {};
        for (const bti in Object.keys(benchmarks)) {

            let key = Object.keys(benchmarks)[bti];
            filteredBenchmarks[key] = [];

            for (const bci in benchmarks[key]) {
                if (largeNumbersInName[key]) {
                    if (benchmarks[key][bci].name.includes(largeNumbersInName[key])) {
                        filteredBenchmarks[key].push(benchmarks[key][bci]);
                    }
                }

            }
        }

        const fuseCpus = new Fuse(filteredBenchmarks.cpu, fuseOptions);
        const fuseGpus = new Fuse(filteredBenchmarks.gpu, fuseOptions);

        cpuBenchmarkMatches = fuseCpus.search(products[pi].cpu);
        gpuBenchmarkMatches = fuseGpus.search(products[pi].gpu);

        let productBenchmarks;

        try {
            productBenchmarks = {
                cpuBenchmarkMatchName: cpuBenchmarkMatches && cpuBenchmarkMatches[0] ? cpuBenchmarkMatches[0].item.name : '',
                cpuBenchmarkMatchMark: cpuBenchmarkMatches && cpuBenchmarkMatches[0] ? cpuBenchmarkMatches[0].item.mark : '',
                gpuBenchmarkMatchName: cpuBenchmarkMatches && gpuBenchmarkMatches[0] ? gpuBenchmarkMatches[0].item.name : '',
                gpuBenchmarkMatchMark: cpuBenchmarkMatches && gpuBenchmarkMatches[0] ? gpuBenchmarkMatches[0].item.mark : ''
            };
        } catch (error) {
            console.error(error);
            console.error(products[pi]);
        }

        products[pi] = Object.assign(products[pi], productBenchmarks);

        if (parseInt(pi) > 0 && parseInt(pi) % 10 === 0) {
            postMessage({progress: (parseInt(pi) + 1)});
        }
    }

    postMessage({results: products});

};