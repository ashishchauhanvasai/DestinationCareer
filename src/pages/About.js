import React from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './About.css';

const About = () => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Thanks for your feedback!");
  };

  return (
    <div className="about-container">
      <h1>About Our E-learning Platform</h1>
      <p>
        Our platform makes learning modern tech skills simple and accessible for everyone.
      </p>
      <ul>
        <li>📘 Learn at your own pace</li>
        <li>👨‍🏫 Courses by experts</li>
        <li>🧠 Beginner to advanced levels</li>
        <li>📜 Certification after completion</li>
        <li>🌐 Access from any device</li>
      </ul>

      <h2>Our Highlights</h2>
      <Slider {...sliderSettings}>
        <div><img src="https://img.freepik.com/free-vector/online-education-design-concept_1284-18151.jpg?t=st=1746709742~exp=1746713342~hmac=3d2573f7e0c835b747616e646d4cf6d18782f7a947e2c42a433eefa0872baba1&w=740" alt="poster1" className="poster-img" /></div>
        <div><img src="https://leadschool.in/wp-content/uploads/2021/04/2-3.png" alt="poster2" className="poster-img" /></div>
        <div><img src="https://www.the-waves.org/wp-content/uploads/2020/06/Screenshot-2020-06-27-at-8.42.57-AM.png" alt="poster3" className="poster-img" /></div>
      </Slider>

      <h2>Feedback Form</h2>
      <form className="feedback-form" onSubmit={handleSubmit}>
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <textarea placeholder="Your Feedback..." required></textarea>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default About;
