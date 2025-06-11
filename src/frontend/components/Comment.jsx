import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useHistory } from "react-router-dom";
import { sendComment, getComments } from "../actions";
import '../assets/styles/components/Comment.scss';

const Comment = (props) => {
  const { product, user, isHome } = props;
  const [comments, setComments] = useState(product.comments || []);
  const inputStyle = classNames('input', { isHome });
  const history = useHistory();

  useEffect(() => {
    if (product?.comments && product._id) {
      getComments(product._id)
        .then(data => {
          setComments(data.data.data.comments);
        })
        .catch(err => console.error("Error al obtener comentarios:", err));
    }
  }, [product._id]);

  const keyPressed = (event) => {
    if (event.key === 'Enter') {
      handleCommentSubmit();
    }
  };

  const handleCommentSubmit = () => {
    const comment = document.getElementById("myComment").value.trim();
    if (!comment) return;

    sendComment(user.id, comment, product._id);
    getComments(product._id)
      .then(data => {
        setComments(data.data.data.comments);
        document.getElementById("myComment").value = "";
      })
      .catch(err => console.error("Error al enviar comentario:", err));
  };

  return (
    <section className="main">
      <h2 className="main__title">¿Tienes un comentario?</h2>
      <input
        type="text"
        id="myComment"
        onKeyDown={keyPressed}
        className={inputStyle}
        placeholder="Comenta..."
      />
      <button type="button" onClick={handleCommentSubmit}>Publica tu comentario</button>

      <h1>Comentarios:</h1>
      {comments.length > 0 ? (
        comments.slice().reverse().map((item, index) => (
          <h2 key={item._id || index}>{item.comment || item}</h2>
        ))
      ) : (
        <p>No hay comentarios aún.</p>
      )}
    </section>
  );
};

Comment.propTypes = {
  isHome: PropTypes.bool,
  product: PropTypes.object,
  user: PropTypes.object
};

const mapStateToProps = (state) => ({
  product: state.product,
  user: state.user
});

export default connect(mapStateToProps, null)(Comment);
