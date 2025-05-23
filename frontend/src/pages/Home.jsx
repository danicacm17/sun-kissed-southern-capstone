import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/Home.css";

function Home() {
  const categorySlides = [
    {
      category: "T-Shirts",
      link: "/category/t-shirts",
      images: [
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747688944/laFlorida1_v6ctlo.webp",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747606473/Flower_Highland_Mockup_Natural_qskb07.png",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747606464/Beach_Sunset_Mockup_White_a1kds4.png",
      ],
    },
    {
      category: "Tank Tops",
      link: "/category/tank-tops",
      images: [
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747864600/TankStrawberryWhite_o3eirf.png",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747864599/TankSummerVibes2Mint_vqsung.png",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747864603/TankSunflowerBlack_nnvjrd.png",
      ],
    },
    {
      category: "Accessories",
      link: "/category/accessories",
      images: [
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747846161/Hat1_gqixym.png",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747846161/FloridaKeyChain_wmpgod.png",
        "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747846161/Sunglass2_vwezcx.png",
      ],
    },
  ];

  const featuredCategories = [
    { name: "Beach Towels", img: "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747846163/TowelBlue2_pqwgya.png", link: "/category/beach-towels" },
    { name: "Tumblers", img: "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747842362/TumblerLakeLife_cnki6p.png", link: "/category/tumblers" },
    { name: "Totes", img: "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747842358/ToteSummerVibes_bovxjb.png", link: "/category/totes" },
    { name: "Accessories", img: "https://res.cloudinary.com/dflhgf4bv/image/upload/v1747846161/Sunglass1_ax30fb.png", link: "/category/accessories" },
  ];

  return (
    <div className="home">
      <div className="hero-banner">
        <img src="/bannerhome.svg" alt="Sun-Kissed & Southern banner" />
      </div>

      <Link to="/category/tumblers">
        <img src="/tumblers-sale.png" alt="Tumblers on Sale - 20% Off!" className="sale-banner" />
      </Link>

      {/* Category Slideshow */}
      <section className="slideshow-section">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 5000 }}
          loop
          pagination={{ clickable: true }}
          className="category-swiper"
        >
          {categorySlides.map((group, idx) => (
            <SwiperSlide key={idx}>
              <Link to={group.link} className="category-slide">
                <h3 className="category-slide-title">{group.category}</h3>
                <div className="category-image-row">
                  {group.images.map((img, i) => (
                    <img src={img} alt={`${group.category} ${i + 1}`} key={i} />
                  ))}
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Shop the Vibe Section */}
      <section className="featured-section">
        <h2>Shop the Vibe</h2>
        <div className="featured-grid">
          {featuredCategories.map(({ name, img, link }) => (
            <Link to={link} className="featured-card" key={name}>
              <img src={img} alt={name} />
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready for Sunshine?</h2>
        <p>Find your perfect look for the boardwalk, the boat, or just brunch.</p>
        <Link to="/category/t-shirts" className="cta-button">Shop New Arrivals</Link>
      </section>
    </div>
  );
}

export default Home;
