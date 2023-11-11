self.addEventListener('message', function(e) {
    const { url, token } = e.data;
  
    const fetchAndPlayAudio = () => {
        fetch(`${url}/get_audio/${token}`)
        .then(response => response.blob())
        .then(audioBlob => {
            postMessage(audioBlob);
        })
        .catch(err => {
            postMessage({ error: err.message });
        });
    };
  
    fetchAndPlayAudio();
  });
  