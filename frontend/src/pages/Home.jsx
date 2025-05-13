import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const featuredCategories = [
    { name: "T-shirts", img: "/placeholders/tshirts.jpg" },
    { name: "Tank Tops", img: "/placeholders/tanktops.jpg" },
    { name: "Beach Towels", img: "/placeholders/beachtowels.jpg" },
    { name: "Accessories", img: "/placeholders/accessories.jpg" },
  ];

  return (
    <div className="home">
      <div className="hero-banner">
        <img src="/bannerhome.svg" alt="Sun-Kissed & Southern banner" />
      </div>

      <div className="tagline">
        <h1>Effortless Style for Sunny Days</h1>
      </div>

      <section className="featured-section">
        <h2>Shop the Vibe</h2>
        <div className="featured-grid">
          {featuredCategories.map(({ name, img }) => (
            <Link
              key={name}
              to={`/category/${encodeURIComponent(name.toLowerCase())}`}
              className="featured-card"
            >
              <img src={img} alt={name} />
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
