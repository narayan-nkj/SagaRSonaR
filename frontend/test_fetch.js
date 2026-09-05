async function test() {
  try {
    const res = await fetch("http://localhost:8000/api/anomalies?mission_id=Jawaharlal%20Nehru%20Port");
    if (!res.ok) {
      console.log("NOT OK", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log("SUCCESS. length:", data.length);
    if(data.length > 0) {
      console.log("First element keys:", Object.keys(data[0]));
    }
  } catch (err) {
    console.error("FETCH ERROR", err);
  }
}
test();
