import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import './heroCarousel.component.css';

const Hero = ({slides}) => {
    return (
        <Carousel fade interval={3000} className="hero-carousel">
            {slides.map((slide, index) => {
                return (
                    <Carousel.Item key={index}>
                        <img
                            className="d-block w-100"
                            src={slide.image}
                            alt="First slide"
                        />
                        <Carousel.Caption>
                            <h3>{slide.title}</h3>
                            <p>{slide.description}</p>
                        </Carousel.Caption>
                    </Carousel.Item>
                );
            })}
        </Carousel>
    );
};

export default Hero;
