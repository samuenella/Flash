import { landmarkList } from "@/constants/landmarkList";

const hashDate = (dateStr: string) => {
	let hash = 0;
	for (let i = 0; i < dateStr.length; i++) {
		hash = (Math.imul(31, hash) + dateStr.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
};

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function getDailyRng(dateStr: string) {
	const seed = hashDate(dateStr);
	return mulberry32(seed);
}

export function getTodaysQuestions(count = 10) {
	const todayUTC = new Date();
	todayUTC.setUTCHours(todayUTC.getUTCHours() + 8); // Adjust to UTC+8
	const todaySGT = todayUTC.toISOString().slice(0, 10); // Get YYYY-MM-DD format
	const rng = getDailyRng(todaySGT);
	// Copy to avoid mutating the original
	const shuffled = [...landmarkList];

	// Fisher-Yates shuffle using your seeded rng
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled.slice(0, count);
}
