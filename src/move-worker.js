self.onmessage = function(e) {
    const { url, token, move } = e.data;
  
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, move })
    })
    .then(response => response.json())
    .catch(err => {
        postMessage({ error: err.message });
    });
};
  