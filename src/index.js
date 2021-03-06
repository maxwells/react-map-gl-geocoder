import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { Component } from 'react'
import PropTypes from 'prop-types'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import { FlyToInterpolator } from 'react-map-gl'
import WebMercatorViewport from 'viewport-mercator-project'

function fitBounds(bounds, viewport) {
  return new WebMercatorViewport(viewport).fitBounds(bounds)
}

function getAccessToken() {
  var accessToken = null

  if (typeof window !== 'undefined' && window.location) {
    var match = window.location.search.match(/access_token=([^&\/]*)/)
    accessToken = match && match[1]
  }

  if (!accessToken && typeof process !== 'undefined') {
    // Note: This depends on bundler plugins (e.g. webpack) inmporting environment correctly
    accessToken = accessToken || process.env.MapboxAccessToken // eslint-disable-line
  }

  return accessToken || null
}

class Geocoder extends Component {
  componentDidMount() {
    // mapRef is undefined on initial page load, so force an update to initialize geocoder
    this.forceUpdate()
  }

  componentWillUnmount() {
    if (this.geocoder) {
      this.geocoder = null
    }
  }

  componentDidUpdate() {
    if (this.geocoder !== undefined) {
      return
    }

    const {
      mapRef,
      mapboxApiAccessToken,
      zoom,
      flyTo,
      placeholder,
      proximity,
      trackProximity,
      bbox,
      types,
      country,
      minLength,
      limit,
      language,
      filter,
      localGeocoder,
      options,
      onInit,
      location,
    } = this.props

    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxApiAccessToken,
      zoom,
      flyTo,
      placeholder,
      proximity,
      trackProximity,
      bbox,
      types,
      country,
      minLength,
      limit,
      language,
      filter,
      localGeocoder,
      ...options
    })
    this.geocoder.on('clear', this.handleClear)
    this.geocoder.on('loading', this.handleLoading)
    this.geocoder.on('results', this.handleResults)
    this.geocoder.on('result', this.handleResult)
    this.geocoder.on('error', this.handleError)

    mapRef.current.getMap().addControl(this.geocoder, location)

    onInit(this.geocoder)
  }

  handleClear = () => {
    this.props.onClear()
  }

  handleLoading = (event) => {
    this.props.onLoading(event)
  }

  handleResults = (event) => {
    this.props.onResults(event)
  }

  handleResult = (event) => {
    const { result } = event
    const { mapRef, onViewportChange, onResult } = this.props
    const { id, bbox, center } = result
    const [longitude, latitude] = center
    const bboxExceptions = {
      'country.3148': {
        name: 'France',
        bbox: [[-4.59235, 41.380007], [9.560016, 51.148506]]
      },
      'country.3145': {
        name: 'United States',
        bbox: [[-171.791111, 18.91619], [-66.96466, 71.357764]]
      },
      'country.330': {
        name: 'Russia',
        bbox: [[19.66064, 41.151416], [190.10042, 81.2504]]
      },
      'country.3179': {
        name: 'Canada',
        bbox: [[-140.99778, 41.675105], [-52.648099, 83.23324]]
      }
    }
    const width = mapRef.current.props.width
    const height = mapRef.current.props.height
    let zoom = this.geocoder.options.zoom

    if (!bboxExceptions[id] && bbox) {
      zoom = fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { width, height }).zoom
    } else if (bboxExceptions[id]) {
      zoom = fitBounds(bboxExceptions[id].bbox, { width, height }).zoom
    }

    if (this.geocoder.options.flyTo) {
      onViewportChange({
        longitude,
        latitude,
        zoom,
        transitionInterpolator: new FlyToInterpolator(),
        transitionDuration: 3000
      })
    } else {
      onViewportChange({ longitude, latitude, zoom })
    }

    onResult(event)
  }

  handleError = (event) => {
    this.props.onError(event)
  }

  getGeocoder() {
    return this.geocoder
  }

  render() {
    return null
  }

  static propTypes = {
    mapRef: PropTypes.object.isRequired,
    onViewportChange: PropTypes.func.isRequired,
    mapboxApiAccessToken: PropTypes.string,
    zoom: PropTypes.number,
    flyTo: PropTypes.bool,
    placeholder: PropTypes.string,
    proximity: PropTypes.object,
    trackProximity: PropTypes.bool,
    bbox: PropTypes.array,
    types: PropTypes.string,
    country: PropTypes.string,
    minLength: PropTypes.number,
    limit: PropTypes.number,
    language: PropTypes.string,
    filter: PropTypes.func,
    localGeocoder: PropTypes.func,
    onInit: PropTypes.func,
    onClear: PropTypes.func,
    onLoading: PropTypes.func,
    onResults: PropTypes.func,
    onResult: PropTypes.func,
    onError: PropTypes.func,
    options: PropTypes.object, // deprecated and will be removed in v2
    location: PropTypes.string,
  }

  static defaultProps = {
    mapboxApiAccessToken: getAccessToken(),
    zoom: 16,
    flyTo: true,
    placeholder: 'Search',
    trackProximity: false,
    minLength: 2,
    limit: 5,
    location: 'top-right',
    onInit: () => {},
    onClear: () => {},
    onLoading: () => {},
    onResults: () => {},
    onResult: () => {},
    onError: () => {}
  }
}

export default Geocoder
