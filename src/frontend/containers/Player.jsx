import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getVideoSource } from "../actions";
import '../assets/styles/components/Player.scss';
import NotFount from "./NotFount";

const Player = (props) => {
  console.log (`1 EN PLAYER.................${JSON.stringify(props)}`)
  var playing = props.playing
  if (playing) {
    console.log (`2 EN PLAYER.................${playing.source}`)
    var playingSource = playing.source || '1.mp4'

  }
  const { id } = props.match.params;
  const hasPlaying = true
  //const hasPlaying = Object.keys(props.playing).length > 0;
  useEffect(() => {
    props.getVideoSource(id);
  }, []);
  return !hasPlaying ? <NotFount /> : (
    <div className="Player">
      <video controls autoPlay>
        <source src={playingSource} type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>
      <div className="Player-back">
        <button type="button" onClick={() => props.history.goBack()}>
          Regresar
        </button>
      </div>
    </div>
  );

}

Player.propTypes = {
  getVideoSource: PropTypes.func,
};

const mapStateToProps = state => {
  return {
    playing: state.playing,
  };
};

const mapDispatchToProps = {
  getVideoSource,
};

export default connect(mapStateToProps, mapDispatchToProps)(Player);
