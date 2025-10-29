import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
export default function PromoScreen(){
  const tg = 'https://t.me/+79288338520';
  const yandex = 'https://yandex.ru/maps/org/bubble_coffee/40703572870?si=3tp8x67573tfx953nu13jz64nm';
  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#07060a',padding:16}}>
      <Text style={{color:'#e9d7ff',fontSize:22,fontWeight:'700'}}>Акции</Text>
      <View style={{marginTop:16}}>
        <Text style={{color:'#fff',marginBottom:8'}}>☕ 7-й кофе в подарок — автоматически</Text>
        <Text style={{color:'#fff',marginBottom:8'}}>🔔 10% при подписке на Telegram</Text>
        <Text style={{color:'#fff',marginBottom:8'}}>⭐ 10% за отзыв на Яндекс.Картах</Text>
      </View>
      <View style={{marginTop:24}}>
        <TouchableOpacity onPress={()=>Linking.openURL(tg)} style={{padding:12,backgroundColor:'#2a0057',borderRadius:8}}>
          <Text style={{color:'#fff'}}>Подписаться в Telegram</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
