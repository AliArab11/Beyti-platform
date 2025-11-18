using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("CustomerAddress")]
[Index("AddressId", Name = "IX_CustomerAddress_Address")]
[Index("CustomerId", Name = "IX_CustomerAddress_Customer")]
[Index("CustomerId", "AddressId", Name = "UQ_CustomerAddress", IsUnique = true)]
public partial class CustomerAddress
{
    [Key]
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public int AddressId { get; set; }

    [ForeignKey("AddressId")]
    [InverseProperty("CustomerAddresses")]
    public virtual Address Address { get; set; } = null!;

    [ForeignKey("CustomerId")]
    [InverseProperty("CustomerAddresses")]
    public virtual Customer Customer { get; set; } = null!;
}
