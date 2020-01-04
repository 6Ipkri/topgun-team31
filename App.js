import React, { Component } from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  ScrollView,
  TouchableHighlight,
  Image,
  ImageBackground,
  Modal
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export default class App extends Component<{}> {
  watchId = null;

  state = {
    loading: false,
    updatesEnabled: false,
    location: 'loading..',
    getFireBase: null,
    modalVisible: false,
    garanteeModelVisible: false,
    pushModalVisible: false,
    latt: 0,
    long: 0,
    pmHex: '??',
    pmDec: '??',
    objectLasted: null,
    pmResult: 'Please reload',
    bgImageURL: require("./assets/img/bg_null.png"),
    faceImageURL: require("./assets/img/null.png"),
  };

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  setPushModalVisible(visible) {
    this.setState({ pushModalVisible: visible });
  }

  setGaranteeModalVisible(visible) {
    this.setState({ garanteeModelVisible: visible });
  }

  hasLocationPermission = async () => {
    if (
      Platform.OS === 'ios' ||
      (Platform.OS === 'android' && Platform.Version < 23)
    ) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  getLocation = async () => {
    this.setGaranteeModalVisible(!this.state.garanteeModelVisible)

    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) return;

    this.setState({ loading: true }, () => {
      Geolocation.getCurrentPosition(
        position => {
          this.setState({ location: position, loading: false });
          const postToFirebase = this.postLocateFirebase();
          console.log(position);
        },
        error => {
          this.setState({ location: error, loading: false });
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 50,
          forceRequestLocation: true,
        },
      );
    });
  };

  getLocationUpdates = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) return;

    this.setState({ updatesEnabled: true }, () => {
      this.watchId = Geolocation.watchPosition(
        position => {
          this.setState({ location: position });
          console.log(position);
        },
        error => {
          this.setState({ location: error });
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 5000,
          fastestInterval: 2000,
        },
      );
    });
  };

  removeLocationUpdates = () => {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.setState({ updatesEnabled: false });
    }
  };

  getLocateFirebase = async () => {
    this.setModalVisible(true);

    fetch('https://top-gun-team31.firebaseio.com/quiz/location/team31/.json')
      .then(response => response.json())
      .then(responseJson => {
        this.setState({ location: responseJson, loading: false });
      })
      .catch(error => {
        console.error(error);
      });
  };


  postLocateFirebase = async () => {
    var coords = this.state.location.coords;
    var lat = coords.latitude;
    var lng = coords.longitude;
    var d = new Date();
    var tzo = - d.getTimezoneOffset() / 60;
    tzo = (tzo + '').padStart(2, '0');
    d = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    var tsp = d.toISOString();
    tsp = tsp.replace('Z', `+${tzo}:00`);

    fetch('https://tgr2020-quiz2.firebaseio.com/quiz/location/team33.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team: 31,
        latitude: lat,
        longitude: lng,
        timestamp: tsp
      }),
    })
      .then(response => response.json())
      .then(responseJson => {
        this.setState({ latt: lat, long: lng });
        this.setPushModalVisible(true);
        // this.getLocateFirebase();
      })
      .catch(error => {
        console.error(error);
      });
  };

  getSensorLastedObject = async () => {
    this.setState({ pmResult: 'Loading..' })

    fetch('https://tgr2020-quiz2.firebaseio.com/quiz/sensor/team33.json')
      .then(response => response.json())
      .then(responseJson => {
        var last = (last = Object.keys(responseJson))[last.length - 1];
        console.log("Lasted obj: " + last)

        this.setState({ objectLasted: last, loading: false });
        this.getPmHex();

      })
      .catch(error => {
        console.error(error);
      });
  }

  getPmHex = async () => {
    fetch('https://tgr2020-quiz2.firebaseio.com/quiz/sensor/team33/' + this.state.objectLasted + '/DevEUI_uplink.json')
      .then(response => response.json())
      .then(responseJson => {
        console.log('pm hex: ' + responseJson)
        this.setState({ pmHex: responseJson.payload_hex });
        this.convertPmHexToDec()
      })
      .catch(error => {
        console.error(error);
      });
  }

  convertPmHexToDec = async () => {
    var decimal = parseInt(this.state.pmHex, 16);
    this.setState({ pmDec: decimal });
    this.criteriaPm();
  }

  criteriaPm = async () => {
    if (this.state.pmDec >= 0 && this.state.pmDec <= 25) {
      this.setState({
        pmResult: 'Very good',
        bgImageURL: require("./assets/img/bg_very_good.png"),
        faceImageURL: require("./assets/img/very_good.png")
      })
    }
    else if (this.state.pmDec >= 26 && this.state.pmDec <= 50) {
      this.setState({
        pmResult: 'Good',
        bgImageURL: require("./assets/img/bg_good.png"),
        faceImageURL: require("./assets/img/good.png")
      })
    }
    else if (this.state.pmDec >= 51 && this.state.pmDec <= 100) {
      this.setState({
        pmResult: 'Moderate',
        bgImageURL: require("./assets/img/bg_moderate.png"),
        faceImageURL: require("./assets/img/moderate.png")
      })
    }
    else if (this.state.pmDec >= 101 && this.state.pmDec <= 200) {
      this.setState({
        pmResult: 'Unhealthy',
        bgImageURL: require("./assets/img/bg_unhealthy.png"),
        faceImageURL: require("./assets/img/unhealthy.png")
      })
    }
    else if (this.state.pmDec >= 201) {
      this.setState({
        pmResult: 'Very unhealthy',
        bgImageURL: require("./assets/img/bg_very_unhealthy.png"),
        faceImageURL: require("./assets/img/very_unhealthy.png")
      })
    }

  }

  garanteeModal = () => {
    this.setGaranteeModalVisible(true);
  }


  render() {
    const { loading, location, updatesEnabled } = this.state;
    return (
      // <ImageBackground source={require('./assets/img/bg_very_good.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Image
          style={styles.background}
          source={this.state.bgImageURL}>
        </Image>
        <ScrollView
          style={{ flex: 8 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>

          <View style={styles.centerContent}>
            <Text style={styles.pmText}>{this.state.pmResult}</Text>
          </View>

          <View style={styles.centerContent}>
            <Image
              style={{ width: 180, height: 180, marginBottom: 5 }}
              source={this.state.faceImageURL} />
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.pmValue}>{this.state.pmDec}</Text>
          </View>

          <View style={styles.centerContent}>
            <TouchableHighlight
              onPress={this.getSensorLastedObject}>
              <Image
                style={{ width: 20, height: 20, marginTop: 20 }}
                source={require('./assets/img/reload.png')}
              />
            </TouchableHighlight>

          </View>

          <View style={styles.button}>
            <TouchableHighlight
              style={styles.buttonItemG}
              onPress={this.getLocateFirebase}
              underlayColor='#fff'>
              <Text style={styles.buttonText}>show locations</Text>
            </TouchableHighlight>

            <TouchableHighlight
              style={styles.buttonItemY}
              onPress={() => this.garanteeModal()}
              underlayColor='#fff'>
              <Text style={styles.buttonText}>push location</Text>
            </TouchableHighlight>
          </View>

        </ScrollView>

        {/*  show database modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}>
          <View style={styles.container}>
            <ScrollView
              style={{ padding: 10, }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <View style={styles.modalBlock}>
                <TouchableHighlight
                  onPress={() => { this.setModalVisible(!this.state.modalVisible) }}>
                  <View style={{ flexDirection: 'row-reverse' }}>
                    <Image
                      style={{ width: 20, height: 20, marginTop: 20, marginRight: 20 }}
                      source={require('./assets/img/cancel.png')} />
                  </View>
                </TouchableHighlight>

                <Text style={{ fontSize: 14, paddingHorizontal: 20, paddingBottom: 20 }}>{JSON.stringify(location, null, 4)}</Text>
              </View>
            </ScrollView>
          </View>

        </Modal>


        {/* garantee modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.garanteeModelVisible}>
          <View style={styles.container}>
            <View style={styles.modalBg}></View>
            <View style={styles.modalBlock}>
              <Text style={{ fontSize: 20, paddingHorizontal: 20, paddingBottom: 20, fontWeight: 'bold', marginTop: 20, color: '#707070' }}>Do you want to push location to database?</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <TouchableHighlight
                  style={styles.buttonItemG}
                  onPress={() => this.getLocation()}>
                  <Text style={styles.buttonText}>YES</Text>
                </TouchableHighlight>
                <TouchableHighlight
                  style={styles.buttonItemG}
                  onPress={() => { this.setGaranteeModalVisible(!this.state.garanteeModelVisible) }}>
                  <Text style={styles.buttonText}>NO</Text>
                </TouchableHighlight>
              </View>

            </View>
          </View>
        </Modal>

        {/* push successful modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.pushModalVisible}>
          <View style={styles.container}>
            <View style={styles.modalBg}></View>
            <View style={styles.modalBlock}>
              <Text style={{ fontSize: 20, paddingHorizontal: 20, paddingBottom: 20, fontWeight: 'bold', marginTop: 20, color: '#707070' }}>push location successful</Text>
              <Text style={{ fontSize: 18, paddingHorizontal: 20, paddingBottom: 20, color: '#707070' }}>latitude   {this.state.latt}</Text>
              <Text style={{ fontSize: 18, paddingHorizontal: 20, color: '#707070' }}>longitude   {this.state.long}</Text>

              <TouchableHighlight
                style={styles.buttonItemG}
                onPress={() => { this.setPushModalVisible(!this.state.pushModalVisible) }}>
                <Text style={styles.buttonText}>OK</Text>
              </TouchableHighlight>
            </View>
          </View>
        </Modal>

      </View>
      // </ImageBackground>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  background: {
    width: 500,
    height: 800,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    opacity: 0.5
  },
  modalBg: {
    // flex: 1,
    // alignSelf: 'stretch',
    // width: null,
    // height: null,
    // backgroundColor: '#FFFFFF',
    // opacity: 0.7,
    width: 500,
    height: 800,
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  modalBlock: {
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.20,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 800,
    height: 1000,
  },
  result: {
    borderWidth: 1,
    borderColor: '#666',
    width: '100%',
    paddingHorizontal: 16,
  },
  buttons: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  buttonItemG: {
    marginRight: 40,
    marginLeft: 40,
    marginTop: 70,
    paddingVertical: 7,
    paddingHorizontal: 30,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2F2F2'
  },
  buttonItemY: {
    marginRight: 40,
    marginLeft: 40,
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 7,
    paddingHorizontal: 30,
    backgroundColor: '#FFCF71',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCF71'
  },
  buttonText: {
    color: '#707070',
    textAlign: 'center',
    fontSize: 17,
  },
  centerContent: {
    marginBottom: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pmValue: {
    width: 90,
    height: 50,
    paddingTop: 4,
    color: '#707070',
    textAlign: 'center',
    fontSize: 30,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F2F2F2'
  },
  pmText: {
    color: '#707070',
    textAlign: 'center',
    fontSize: 23,
  },
});
