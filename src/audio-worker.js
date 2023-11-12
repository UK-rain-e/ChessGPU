self.onmessage = function(e) {
    const { url, token } = e.data;
    const fetchAndPlayAudio = () => {
        fetch(`${url}/get_audio/${token}`, {
            method: 'GET',
            headers: { 'x-cors-api-key': 'live_14b9ef05b52ee5d857f47f364e4545cb026620dba7797bcf5c0b2e2e7536470f' },
        })
        .then(response => response.blob())
        .then(audioBlob => {
            postMessage(audioBlob);
        })
        .catch(err => {
            postMessage({ error: err.message });
        });
    };
  
    fetchAndPlayAudio();
}
  