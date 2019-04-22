(async() => {
	try{
			// Config
		const ARRAY_SIZE = 50000000
		const NUM_TESTS = 5
		const NUM_THREADS = 4

			// Init
		const NO_THREADS = "Default (no threads)"
		const WITH_THREADS = "Threads (4 threads)"

			// Require
		let {Worker, isMainThread, workerData, threadId, parentPort} = require("worker_threads")

		let log = (msg) => {
			if(isMainThread)
				console.log(msg)
		}

		let benchmark = async({fn, name, num_tests = 1}) => {
			let AVG_TIME = 0
			log(`	Benchmarking ${name}`)
			for(let num_test = 0; num_test < num_tests; ++num_test){
				const TIME_START = new Date()
				if(name == WITH_THREADS || (name == NO_THREADS && isMainThread))
					await fn()
				const TIME_END = new Date()
				const TIME_DIFF = (TIME_END - TIME_START)/1000
				log(`Time diff = ${TIME_DIFF}`)
				AVG_TIME += TIME_DIFF / num_tests
			}
			AVG_TIME = AVG_TIME.toFixed(3)
			log(`	Average time taken (${num_tests} ops): ${AVG_TIME}s\n`)

			return {name, average_time: AVG_TIME}
		}

		let generateArray_classic = async() => {
			return new Promise((resolve, reject) => {
				let arr = new Array(ARRAY_SIZE).fill(Math.random())
				// console.log(arr.length)
				resolve()
			})
		}

		let generateArray_threads = async() => {
			return new Promise((resolve, reject) => {
				if(isMainThread){
					let resultArr = []

					const ARRAY_CHUNK_SIZE = Math.floor(ARRAY_SIZE / NUM_THREADS)
					let num_generated_elements = 0
					let num_finished_workers = 0
					for(let index=0; index<NUM_THREADS; ++index){
						const START_INDEX = index > 0 ? ARRAY_CHUNK_SIZE*index : 0
						const END_INDEX = index < NUM_THREADS-1 ? ARRAY_CHUNK_SIZE*(index+1) : ARRAY_SIZE
						const CURR_CHUNK_SIZE = END_INDEX - START_INDEX

						let worker = new Worker(__filename, {workerData: {
							chunk_size: CURR_CHUNK_SIZE,
						}})
						worker.on("message", (arr) => {
							// console.log(`Current length = ${resultArr.length}, amount of received elements = ${arr.length}`)
							// resultArr = resultArr.concat(arr)
						})
						worker.on("exit", () => {
							num_generated_elements += CURR_CHUNK_SIZE
							++num_finished_workers
							// console.log(`Worker ${index} has finished!`)
							if(num_finished_workers == NUM_THREADS) { // All threads have finished their work!
								// console.log(`Generated ${num_generated_elements} out of ${ARRAY_SIZE} elements.`)
								// console.log("Array length: "+resultArr.length)
								resolve()
							}
						})
					}
				}else{
					let {chunk_size} = workerData

					// console.log(`Chunk size: ${chunk_size}`)
					let arr = new Array(chunk_size).fill(Math.random())
					parentPort.postMessage("")
				}
			})
		}

		let benchmarks = []
		if(isMainThread){
			console.log(`		Generating ${ARRAY_SIZE} elements\n`)
			benchmarks.push(await benchmark({fn: generateArray_classic, num_tests: NUM_TESTS, name: NO_THREADS}))
		}
		benchmarks.push(await benchmark({fn: generateArray_threads, num_tests: NUM_TESTS, name: WITH_THREADS}))
		if(isMainThread){
			benchmarks = benchmarks.sort((a, b) => a.average_time < b.average_time ? -1 : 1)
		}
		log(`Winner: ${benchmarks[0].name}`)
	}catch(e){
		console.log(e)
	}
})()