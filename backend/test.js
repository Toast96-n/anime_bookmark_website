const { ANIME } = require("@consumet/extensions");

const main = async () => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  const animePahe = new ANIME.AnimePahe();

  try {
    // 1. SEARCH for anime
    const searchResults = await animePahe.search("spy x family");
    console.log("Search Results:", searchResults.results.length);
    
    if (searchResults && searchResults.results.length > 0) {
      const anime = searchResults.results[0];
      console.log("Selected:", anime.title);
      
      // 2. GET ANIME INFO with the ID
      try {
        const animeInfo = await animePahe.fetchAnimeInfo(anime.id);
        console.log("Anime Info:", animeInfo);
      } catch (e) {
        console.error("fetchAnimeInfo error:", e.message);
      }

      // 3. GET EPISODES
      try {
        const episodes = await animePahe.fetchEpisodes(anime.id);
        console.log("Episodes:", episodes);
      } catch (e) {
        console.error("fetchEpisodes error:", e.message);
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();