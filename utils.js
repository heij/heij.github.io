let utils = {
	asyncTimeout: (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	},
	asyncForEach: async (iter, cb) => {
		for ([i, v] of iter.entries()) {
			await cb(v, i)
		}
	}
}