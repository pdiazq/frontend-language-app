import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { detailProd } from '../actions';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Photo from '../components/Photo';
import Search from '../components/Search';
import PaypalBtn from '../components/PaypalBtn';
import Comment from '../components/Comment';
import NotFount from '../containers/NotFount';
// import '../assets/styles/components/Detail.scss';

const Detail = ({ product, user, detailProd }) => {
  const { id } = useParams();

  useEffect(() => {
    detailProd(id);
  }, [id, detailProd]);

  if (!product || !product.title) {
    return (
      <div className="detail-loading">
        <h2>Cargando producto o no encontrado...</h2>
      </div>
    );
  }

  const paymentHandler = (details, data) => {
    alert(`${user.name}, tu compra fue realizada :)`);
  };

  return (
    <>
      <Header />
      <Search isHome />
      <div className="detail-content">
        {/* Aquí pasamos sólo la URL de la imagen */}
        <Photo image={product.cover} />
        <div className="detail-info">
          <h1>{product.title}</h1>
          <p><strong>Año:</strong> {product.year}</p>
          <p><strong>Descripción:</strong> {product.description}</p>
          <p><strong>Tags:</strong> {product.tags && product.tags.join(', ')}</p>
          <div className="detail-actions">
            <PaypalBtn
              amount={product.price}
              currency={product.currency || 'USD'}
              onSuccess={paymentHandler}
            />
            <Comment isHome />
          </div>
        </div>
      </div>
    </>
  );
};

Detail.propTypes = {
  product: PropTypes.object,
  user: PropTypes.object,
  detailProd: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  product: state.product,
  user: state.user || {},
});

const mapDispatchToProps = { detailProd };

export default connect(mapStateToProps, mapDispatchToProps)(Detail);
