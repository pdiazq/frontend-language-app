import React from 'react';
import '../assets/styles/components/Categories.scss';

const Categories = ({ title, children }) => {

  console.log('categorias', title)

  return (
      <div className="Categories">
        <h3 className="categories__title">{title}</h3>
        {children}
      </div>
  );


}

export default Categories;
