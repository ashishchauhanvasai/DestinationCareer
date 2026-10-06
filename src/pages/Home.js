import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Slider Section */}
      <div className="hero-slider">
        <div className="slide">
          <img
            src="https://blogassets.leverageedu.com/blog/wp-content/uploads/2020/03/24185535/Online-Learning-800x500.jpg  "
            alt="Learn Online"
          />
          <div className="slide-text">
            <h1>Welcome to E-learning</h1>
            <p>Online platform to learn new skills and grow your career.</p>
            <Link to="/courses" className="btn-explore">Explore Courses</Link>
          </div>
        </div>
      </div>

      {/* Feature Posters Section */}
      <div className="featured-posters">
        <h2>Popular Categories</h2>
        <div className="poster-grid">
          <div className="poster">
            <img
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=compress&cs=tinysrgb&w=800"
              alt="Web Development"
            />
            <h3>Web Development</h3>
          </div>
          <div className="poster">
            <img
              src="https://img.freepik.com/free-photo/representations-user-experience-interface-design_23-2150104516.jpg?t=st=1746643008~exp=1746646608~hmac=3f1acae5201584647a683ea88540efca0e75dc2146ad635019fe86558e1397f1&w=1380"
              alt="UI/UX Design"
            />
            <h3>UI/UX Design</h3>
          </div>
          <div className="poster">
            <img
              src="https://img.freepik.com/free-photo/programming-background-with-person-working-with-codes-computer_23-2150010125.jpg?t=st=1746642977~exp=1746646577~hmac=b476cc00b16b4c11c84aa37731eae08aac9d9c8b8388d54b19b0e1b967c1055b&w=996"
              alt="Backend Development"
            />
            <h3>Backend Development</h3>
          </div>
          <div className="poster">
            <img
              src="https://img.freepik.com/premium-photo/python-programming-language-programing-workflow-abstract-algorithm-concept-virtual-screen_161452-10951.jpg?w=1380"
              alt="Python Programming"
            />
            <h3>Python Programming</h3>
          </div>
        </div>
      </div>

   
    </div>
  );
};

export default Home;
