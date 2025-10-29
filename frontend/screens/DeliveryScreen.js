import React from 'react';
import { View, Text, SafeAreaView, Linking, TouchableOpacity } from 'react-native';
export default function DeliveryScreen(){
  const yandex = 'https://yandex.ru/maps/org/bubble_coffee/40703572870?si=3tp8x67573tfx953nu13jz64nm';
  return (<SafeAreaView style={{flex:1,backgroundColor:'#07060a',padding:16}}>
    <Text style={{color:'#e9d7ff',fontSize:20,fontWeight:'700'}}>Доставка</Text>
    <Text style={{color:'#fff',marginTop:12}}>Доставка по району Солнцево, Москва. Самовывоз — по адресу на карте.</Text>
    <TouchableOpacity onPress={()=>Linking.openURL(yandex)} style={{marginTop:20,padding:12,backgroundColor:'#2a0057',borderRadius:8}}>
      <Text style={{color:'#fff'}}>Открыть на карте</Text>
    </TouchableOpacity>
  </SafeAreaView>);
}
