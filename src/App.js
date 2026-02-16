import { useEffect, useRef, useState } from "react";

export default function App() {
  const canvasRef = useRef(null);

  const W = 360;
  const H = 540;
  const ROAD_W = 220;
  const ROAD_X = (W - ROAD_W) / 2;

  const [speed, setSpeed] = useState(0);
  const [bikeX, setBikeX] = useState(ROAD_W / 2);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const carsRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const scoreRef = useRef(0);

  // Fullscreen city background
  const cityBg = new Image();
  cityBg.src = "https://i.ibb.co/3F2RzT7/city-bg.jpg"; // building background

  const restartGame = () => {
    carsRef.current = [];
    setBikeX(ROAD_W / 2);
    setSpeed(0);
    setScore(0);
    scoreRef.current = 0;
    setRunning(false);
    setPaused(false);
    setGameOver(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let anim;
    let roadOffset = 0;

    const drawRoad = () => {
      // Draw city full background
      if (cityBg.complete) ctx.drawImage(cityBg, 0, 0, W, H);

      // Road
      ctx.fillStyle = "#555";
      ctx.fillRect(ROAD_X, 0, ROAD_W, H);

      ctx.strokeStyle = "#eee";
      ctx.setLineDash([30, 25]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2, roadOffset);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawBike = () => {
      const y = H - 130;
      const cx = ROAD_X + bikeX;

      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(cx, y + 55, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1e88e5";
      ctx.beginPath();
      ctx.moveTo(cx - 10, y + 60);
      ctx.lineTo(cx + 10, y + 60);
      ctx.lineTo(cx + 5, y + 15);
      ctx.lineTo(cx - 5, y + 15);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#0d47a1";
      ctx.fillRect(cx - 4, y + 30, 8, 18);

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, y + 10, 5, 0, Math.PI * 2);
      ctx.fill();

      if (speed > 6) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(cx - 2, y + 65);
        ctx.lineTo(cx + 2, y + 65);
        ctx.lineTo(cx, y + 80 + Math.random() * 6);
        ctx.closePath();
        ctx.fill();
      }
    };

    const drawCars = () => {
      carsRef.current.forEach((c) => {
        const x = ROAD_X + c.x;
        const y = c.y;

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x + 6, y + 55, 28, 10);

        ctx.fillStyle = "#b71c1c";
        ctx.fillRect(x, y, 40, 60);

        ctx.fillStyle = "#90caf9";
        ctx.fillRect(x + 6, y + 8, 28, 14);

        ctx.fillStyle = "#fff";
        ctx.fillRect(x + 5, y + 55, 6, 5);
        ctx.fillRect(x + 29, y + 55, 6, 5);
      });
    };

    const spawnCar = () => {
      const now = Date.now();
      if (now - lastSpawnRef.current > 1800) {
        carsRef.current.push({
          x: Math.random() * (ROAD_W - 40),
          y: -80,
          speed: 2 + Math.random() * 1.5,
        });
        lastSpawnRef.current = now;
      }
    };

    const updateCars = () => {
      carsRef.current.forEach((c) => (c.y += speed + c.speed));
      carsRef.current = carsRef.current.filter((c) => c.y < H + 100);
    };

    const checkCollision = () => {
      const bikeY = H - 130;
      if (bikeX < 8 || bikeX > ROAD_W - 8) {
        setGameOver(true);
        setRunning(false);
        setPaused(false);
      }
      carsRef.current.forEach((c) => {
        const dx = Math.abs((ROAD_X + bikeX) - (ROAD_X + c.x + 20));
        const dy = Math.abs((bikeY + 35) - (c.y + 30));
        if (dx < 30 && dy < 60) {
          setGameOver(true);
          setRunning(false);
          setPaused(false);
        }
      });
    };

    const loop = () => {
      if (!running || paused) return;

      ctx.clearRect(0, 0, W, H);

      roadOffset += speed * 2;
      if (roadOffset > 55) roadOffset = 0;

      spawnCar();
      updateCars();

      drawRoad();
      drawCars();
      drawBike();
      checkCollision();

      scoreRef.current += 0.1 + speed / 20;
      setScore(Math.floor(scoreRef.current));

      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(`Score: ${Math.floor(scoreRef.current)}`, 10, 20);
      ctx.fillText(`Speed: ${Math.floor(speed)}`, 10, 40);

      anim = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(anim);
  }, [bikeX, speed, running, paused]);

  useEffect(() => {
    const key = (e) => {
      if (gameOver && e.key === "Enter") restartGame();
      if (!running || paused) return;

      if (e.key === "ArrowUp") setSpeed((s) => Math.min(s + 0.4, 14));
      if (e.key === "ArrowDown") setSpeed((s) => Math.max(s - 0.6, 0));
      if (e.key === "ArrowLeft") setBikeX((x) => x - 10);
      if (e.key === "ArrowRight") setBikeX((x) => x + 10);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [running, paused, gameOver]);

  return (
    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        position: "relative",
        textAlign: "center",
        color: "#fff",
      }}
    >
      <h3>🏍️ Racing Moto</h3>

      {/* Start Button */}
      {!running && !gameOver && !paused && (
        <button
          onClick={() => setRunning(true)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "15px 30px",
            fontSize: "18px",
          }}
        >
          Start
        </button>
      )}

      {/* Pause Button */}
{running && !paused && !gameOver && (
  <button
    onClick={() => setPaused(true)}
    style={{
      position: "absolute",
      top: `${H + 20}px`,  // below canvas
      left: "20px",         // left margin
      right: "280px",        // right margin
      margin: "0 auto",     // center horizontally
      display: "block",
      padding: "10px 0",
      fontSize: "18px",
      width: `calc(40% - 40px)`, // match start button width
      maxWidth: "90px",    // same max width
    }}
  >
    Pause
  </button>
)}
      {/* Resume / Restart Buttons */}
      {paused && !gameOver && (
        <>
          <button
            onClick={() => setPaused(false)}
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "15px 30px",
              fontSize: "16px",
            }}
          >
            Resume
          </button>
          <button
            onClick={restartGame}
            style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "15px 30px",
              fontSize: "16px",
            }}
          >
            Restart
          </button>
        </>
      )}

      {/* Game Over */}
      {gameOver && (
        <>
          <h2
            style={{
              color: "red",
              position: "absolute",
              top: "40%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            💥 GAME OVER
          </h2>
          <button
            onClick={restartGame}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "15px 30px",
              fontSize: "16px",
            }}
          >
            Restart
          </button>
        </>
      )}

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ border: "3px solid white", marginTop: "20px" }}
      />


    </div>
  );
}
