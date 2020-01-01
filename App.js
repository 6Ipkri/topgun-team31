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
    location: {},
    getFireBase: null,
    modalVisible: false,
    pushModalVisible: false,
    latt: 0,
    long: 0,
  };

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  setPushModalVisible(visible) {
    this.setState({ pushModalVisible: visible });
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
        //  Alert.alert("Author name at 0th index:  " + responseJson);
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

    fetch('https://top-gun-team31.firebaseio.com/quiz/location/team31/.json', {
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
        //  Alert.alert("Author name at 0th index:  " + responseJson);
        // this.setState({location: responseJson, loading: false});
      })
      .catch(error => {
        console.error(error);
      });
  };

  render() {
    const { loading, location, updatesEnabled } = this.state;
    return (
      // <ImageBackground source={require('./assets/img/bg_very_good.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <ScrollView
          style={{ flex: 8 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>

          <View style={styles.centerContent}>
            <Text style={styles.pmText}>Please Reload</Text>
          </View>

          <View style={styles.centerContent}>
            <Image
              style={{ width: 180, height: 180, marginBottom: 5 }}
              source={require('./assets/img/good.png')} />
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.pmValue}>??</Text>
          </View>

          <View style={styles.centerContent}>
            <Image
              style={{ width: 20, height: 20, marginTop: 20 }}
              source={require('./assets/img/reload.png')} />
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
              onPress={() => this.getLocation()}
              // onPress={() => this.setPushModalVisible(true)}
              underlayColor='#fff'>
              <Text style={styles.buttonText}>push location</Text>
            </TouchableHighlight>
          </View>

        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}>
          <View style={styles.container}>
            <ScrollView
              style={{padding: 20, }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <View style={styles.modalBg}></View>
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
  modalBg: {
    flex: 1,
    alignSelf: 'stretch',
    width: null,
    height: null,
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

//  export default App;




/ old version /
// {/* <View style={styles.container}>
//   <ScrollView>
//     {/* <Button
//             title="Get Location"
//             onPress={this.getLocation}
//             disabled={loading || updatesEnabled}
//           /> */}
//     <View style={styles.buttons}>
//       <Button
//         title="Post Firebase"
//         onPress={() => this.getLocation()}
//         disabled={loading || updatesEnabled}
//       />
//       <Button title="Get Firebase" onPress={this.getLocateFirebase} />
//     </View>
//     {/* <View style={styles.buttons}>
//           <Button
//             title="Start Observing"
//             onPress={this.getLocationUpdates}
//             disabled={updatesEnabled}
//           />
//           <Button
//             title="Stop Observing"
//             onPress={this.removeLocationUpdates}
//             disabled={!updatesEnabled}
//           />
//         </View> */} */}
