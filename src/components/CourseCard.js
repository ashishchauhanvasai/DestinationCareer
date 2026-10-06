// src/components/CourseCard.js
import React from 'react';
import './CourseCard.css';

function CourseCard({ title, description, author, image }) {
  return (
    <div className="course-card">
      <img src={image} alt={title} className="course-image" />
      <h3>{title}</h3>
      <p>{description}</p>
      <span>By {author}</span>
    </div>
  );
}

export default CourseCard;
