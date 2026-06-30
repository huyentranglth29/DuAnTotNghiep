import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MovieBookingInfo} from './MovieName';
import PromoCarousel from './PromoCarousel';

const nowShowingMovies = [
  {
    title: 'Ám Ảnh',
    duration: '109 phút',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: true,
    poster: require('../../../assets/showtime/bong-quy.jpg'),
  },
  {
    title: 'Bầy Xác Sống',
    duration: '122 phút',
    age: 'T16',
    ageColor: '#f1d83f',
    hot: true,
    poster: require('../../../assets/showtime/den-la-sat.jpg'),
  },
  {
    title: 'Lầu Chủ Hòa',
    duration: '94 phút',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: true,
    poster: require('../../../assets/showtime/dong-dao-ma-quai.jpg'),
  },
  {
    title: 'Backrooms',
    duration: '93 phút',
    age: 'T16',
    ageColor: '#f1d83f',
    hot: true,
    poster: require('../../../assets/showtime/minions.jpg'),
  },
  {
    title: 'Doraemon',
    duration: '105 phút',
    age: 'P',
    ageColor: '#87c846',
    hot: false,
    poster: require('../../../assets/showtime/moana.jpg'),
  },
  {
    title: 'Thám Tử Lừng Danh',
    duration: '111 phút',
    age: 'T18',
    ageColor: '#f47fa2',
    hot: false,
    poster: require('../../../assets/showtime/sheep-in-the-box.jpg'),
  },
];

type DangChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function DangChieu({onMoviePress}: DangChieuProps) {
  return (
    <View style={styles.container}>
      <PromoCarousel />

      <View style={styles.movieGrid}>
        {nowShowingMovies.map(movie => (
          <TouchableOpacity
            key={movie.title}
            activeOpacity={0.85}
            style={styles.movieCard}
            onPress={() => onMoviePress(movie)}>
            <View style={styles.posterWrap}>
              <Image source={movie.poster} style={styles.moviePoster} />
              <View style={[styles.ageBadge, {backgroundColor: movie.ageColor}]}>
                <Text style={styles.ageText}>{movie.age}</Text>
              </View>
              {movie.hot && (
                <View style={styles.hotRibbon}>
                  <Text style={styles.hotText}>HOT</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <Text style={styles.movieDuration}>{movie.duration}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingBottom: 18,
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 18,
  },
  movieCard: {
    width: '31.7%',
    marginBottom: 28,
  },
  posterWrap: {
    aspectRatio: 0.68,
    borderRadius: 5,
    backgroundColor: '#e9eef3',
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ageBadge: {
    position: 'absolute',
    left: 7,
    top: 7,
    minWidth: 37,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  hotRibbon: {
    position: 'absolute',
    right: -27,
    top: 10,
    width: 86,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6d16',
    transform: [{rotate: '45deg'}],
  },
  hotText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  movieTitle: {
    color: '#242424',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  movieDuration: {
    color: '#9b9b9b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DangChieu;
