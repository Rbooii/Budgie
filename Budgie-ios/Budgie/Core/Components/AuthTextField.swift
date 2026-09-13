//
//  AuthTextField.swift
//  Budgie
//
//  Created by Arco zakwan putra on 13/09/26.
//

import SwiftUI

struct AuthTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .never
    var contentType: UITextContentType?

    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 12) {
            Group {
                if isSecure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .font(.system(size: 17))
            .foregroundStyle(Color.budgieTextPrimary)
            .tint(.budgieBrand)
            .keyboardType(keyboardType)
            .textContentType(contentType)
            .textInputAutocapitalization(autocapitalization)
            .autocorrectionDisabled()
            .focused($isFocused)

            Rectangle()
                .fill(isFocused ? Color.budgieBrand : Color.budgieHairline)
                .frame(height: 1)
                .animation(.easeOut(duration: 0.2), value: isFocused)
        }
        .padding(.vertical, 10)
    }
}

#Preview {
    @Previewable @State var email = ""
    @Previewable @State var password = ""

    VStack(spacing: 12) {
        AuthTextField(placeholder: "Email", text: $email, keyboardType: .emailAddress)
        AuthTextField(placeholder: "password", text: $password, isSecure: true)
    }
    .padding(.horizontal, 16)
}
