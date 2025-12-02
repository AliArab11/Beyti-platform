using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti.Data;

[Table("Seller")]
[Index("UserProfileId", Name = "IX_Seller_UserProfile")]
[Index("UserProfileId", Name = "UQ__Seller__9E267F63348F9C5C", IsUnique = true)]
public partial class Seller
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    [StringLength(120)]
    public string StoreName { get; set; } = null!;

    [StringLength(30)]
    public string? Phone { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("Seller")]
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

    [InverseProperty("Seller")]
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    [InverseProperty("Seller")]
    public virtual ICollection<SellerAddress> SellerAddresses { get; set; } = new List<SellerAddress>();

    [ForeignKey("UserProfileId")]
    [InverseProperty("Seller")]
    public virtual UserProfile UserProfile { get; set; } = null!;
}
